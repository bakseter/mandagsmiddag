package routes

import (
	"errors"
	"net/http"
	"time"

	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DinnerJSON struct {
	ID             uint   `json:"id,omitempty"`
	HostUserID     uint   `json:"hostUserId,omitempty"`
	ParticipantIDs []uint `json:"participantIds,omitempty"`
	Date           string `json:"date,omitempty"`
	Food           string `json:"food,omitempty"`
	FilmIMDBUrl    string `json:"filmImdbUrl,omitempty"` // Changed from FilmID
	FilmTitle      string `json:"filmTitle,omitempty"`   // Added
}

func DinnerRoutes(router *gin.RouterGroup, database *gorm.DB) {
	router.GET("/dinner", models.WithDatabase(getAllDinners, database))
	router.GET("/dinner/host/:id", models.WithDatabase(getAllDinnersForUser, database))
	router.GET("dinner/:id", models.WithDatabase(getDinnerWithID, database))
	router.PUT("/dinner", models.WithDatabase(putDinner, database))
	router.DELETE("/dinner/:id", models.WithDatabase(deleteDinnerWithID, database))
}

func putDinner(ctx *gin.Context, database *gorm.DB) { //nolint:gocognit,cyclop,funlen
	authentikUser, err := getAuthentikUser(ctx)
	if err != nil {
		ctx.JSON(401, gin.H{"error": err.Error()})

		return
	}

	// Check if user exists in database
	var user models.User
	if err := database.Where("email = ?", authentikUser.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(401, gin.H{"error": "user not found in database"})

			return
		}

		ctx.JSON(500, gin.H{"error": "failed to fetch user"})

		return
	}

	// Parse dinner JSON
	var dinnerJSON DinnerJSON
	if err := ctx.ShouldBindJSON(&dinnerJSON); err != nil {
		ctx.JSON(400, gin.H{"error": err.Error()})

		return
	}

	// Parse date string to time.Time
	parsedDate, err := time.Parse(time.RFC3339, dinnerJSON.Date)
	if err != nil {
		ctx.JSON(400, gin.H{"error": "invalid date format, use ISO 8601 (RFC3339)"})

		return
	}

	var hostUser models.User
	if err := database.Where("id = ?", dinnerJSON.HostUserID).First(&hostUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(400, gin.H{"error": "host user not found"})

			return
		}

		ctx.JSON(500, gin.H{"error": "failed to fetch host user"})

		return
	}

	if hostUser.ID != user.ID && !user.IsAdmin {
		ctx.JSON(403, gin.H{"error": "non-admin users can only create or update dinners where they are the host"})

		return
	}

	// Handle film: find existing or create new
	var (
		film   models.Film
		filmID *uint
	)

	if dinnerJSON.FilmIMDBUrl != "" { //nolint:nestif
		// Try to find existing film by IMDB URL
		err := database.Where("imdb_url = ?", dinnerJSON.FilmIMDBUrl).First(&film).Error

		if errors.Is(err, gorm.ErrRecordNotFound) { //nolint:gocritic
			// Film doesn't exist, create it
			if dinnerJSON.FilmTitle == "" {
				ctx.JSON(400, gin.H{"error": "film_title is required when creating a new film"})

				return
			}

			film = models.Film{
				Title:   dinnerJSON.FilmTitle,
				IMDBUrl: dinnerJSON.FilmIMDBUrl,
			}

			if err := database.Create(&film).Error; err != nil {
				ctx.JSON(500, gin.H{"error": "failed to create film"})

				return
			}

			filmID = &film.ID
		} else if err != nil {
			ctx.JSON(500, gin.H{"error": "failed to fetch film"})

			return
		} else {
			// Film exists
			filmID = &film.ID
		}
	}
	// If FilmIMDBUrl is empty, filmID remains nil (no film selected)

	var participants []models.User
	if err := database.Where("id IN ?", dinnerJSON.ParticipantIDs).Find(&participants).Error; err != nil {
		ctx.JSON(500, gin.H{"error": "failed to fetch participants"})

		return
	}

	if len(participants) != len(dinnerJSON.ParticipantIDs) {
		ctx.JSON(400, gin.H{"error": "one or more participant IDs not found"})

		return
	}

	// Create dinner model
	dbDinner := models.Dinner{
		HostUserID:   hostUser.ID,
		Date:         parsedDate,
		Food:         dinnerJSON.Food,
		FilmID:       filmID,
		Participants: participants,
	}

	if dinnerJSON.ID != 0 { //nolint:nestif
		// Update existing dinner
		var existingDinner models.Dinner
		if err := database.Where("id = ?", dinnerJSON.ID).First(&existingDinner).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				ctx.JSON(404, gin.H{"error": "dinner not found for update"})

				return
			}

			ctx.JSON(500, gin.H{"error": "failed to fetch existing dinner for update"})

			return
		}

		dbDinner.ID = existingDinner.ID

		// Update scalar fields first
		if err := database.Model(&existingDinner).Updates(dbDinner).Error; err != nil {
			ctx.JSON(500, gin.H{"error": "failed to update dinner"})

			return
		}

		// Then replace participants explicitly
		if err := database.Model(&existingDinner).
			Association("Participants").
			Replace(participants); err != nil {
			ctx.JSON(500, gin.H{"error": "failed to update participants"})

			return
		}

		ctx.JSON(200, gin.H{"message": "dinner updated successfully"})

		return
	}

	// Create new dinner
	if err := database.Create(&dbDinner).Error; err != nil {
		ctx.JSON(500, gin.H{"error": "failed to create dinner"})

		return
	}

	ctx.JSON(201, gin.H{"message": "dinner created successfully"})
}

func getAllDinners(ctx *gin.Context, database *gorm.DB) {
	var dinners []models.Dinner
	if err := database.
		Preload("Participants", func(db *gorm.DB) *gorm.DB {
			return db.Select("id")
		}).
		Preload("Film").
		Order("date DESC").
		Find(&dinners).Error; err != nil {
		ctx.JSON(500, gin.H{"error": "failed to fetch dinners"})

		return
	}

	if len(dinners) == 0 {
		ctx.JSON(200, []DinnerJSON{})

		return
	}

	var dinnerList []DinnerJSON

	for _, dinner := range dinners {
		// Extract participant IDs
		participantIDs := make([]uint, len(dinner.Participants))
		for i, participant := range dinner.Participants {
			participantIDs[i] = participant.ID
		}

		dinnerJSON := DinnerJSON{
			ID:             dinner.ID,
			HostUserID:     dinner.HostUserID,
			Date:           dinner.Date.Format(time.RFC3339),
			Food:           dinner.Food,
			ParticipantIDs: participantIDs,
		}

		// Add film info if available
		if dinner.Film != nil {
			dinnerJSON.FilmIMDBUrl = dinner.Film.IMDBUrl
			dinnerJSON.FilmTitle = dinner.Film.Title
		}

		dinnerList = append(dinnerList, dinnerJSON)
	}

	ctx.JSON(200, dinnerList)
}

func getAllDinnersForUser(ctx *gin.Context, database *gorm.DB) {
	var dinners []models.Dinner

	hostID := ctx.Param("id")
	if err := database.
		Where("host_user_id = ?", hostID).
		Preload("Participants", func(db *gorm.DB) *gorm.DB {
			return db.Select("id")
		}).
		Preload("Film").
		Order("date DESC").
		Find(&dinners).Error; err != nil {
		ctx.JSON(500, gin.H{"error": "failed to fetch dinners"})

		return
	}

	if len(dinners) == 0 {
		ctx.JSON(200, []DinnerJSON{})

		return
	}

	var dinnerList []DinnerJSON

	for _, dinner := range dinners {
		// Extract participant IDs
		participantIDs := make([]uint, len(dinner.Participants))
		for i, participant := range dinner.Participants {
			participantIDs[i] = participant.ID
		}

		dinnerJSON := DinnerJSON{
			ID:             dinner.ID,
			HostUserID:     dinner.HostUserID,
			Date:           dinner.Date.Format(time.RFC3339),
			Food:           dinner.Food,
			ParticipantIDs: participantIDs,
		}

		// Add film info if available
		if dinner.Film != nil {
			dinnerJSON.FilmIMDBUrl = dinner.Film.IMDBUrl
			dinnerJSON.FilmTitle = dinner.Film.Title
		}

		dinnerList = append(dinnerList, dinnerJSON)
	}

	ctx.JSON(200, dinnerList)
}

func getDinnerWithID(ctx *gin.Context, database *gorm.DB) {
	dinnerID := ctx.Param("id")

	var dinner models.Dinner
	if err := database.Where("id = ?", dinnerID).
		Preload("Participants", func(db *gorm.DB) *gorm.DB {
			return db.Select("id")
		}).
		Preload("Film").
		First(&dinner).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(404, gin.H{"error": "dinner not found"})
		} else {
			ctx.JSON(500, gin.H{"error": "failed to fetch dinner"})
		}

		return
	}

	// Extract participant IDs
	participantIDs := make([]uint, len(dinner.Participants))
	for i, participant := range dinner.Participants {
		participantIDs[i] = participant.ID
	}

	dinnerJSON := DinnerJSON{
		ID:             dinner.ID,
		HostUserID:     dinner.HostUserID,
		Date:           dinner.Date.Format(time.RFC3339),
		Food:           dinner.Food,
		ParticipantIDs: participantIDs,
	}

	// Add film info if available
	if dinner.Film != nil {
		dinnerJSON.FilmIMDBUrl = dinner.Film.IMDBUrl
		dinnerJSON.FilmTitle = dinner.Film.Title
	}

	ctx.JSON(200, dinnerJSON)
}

func deleteDinnerWithID(ctx *gin.Context, database *gorm.DB) {
	dinnerID := ctx.Param("id")
	if err := database.Delete(&models.Dinner{}, dinnerID).Error; err != nil {
		ctx.JSON(500, gin.H{"error": "failed to delete dinner"})

		return
	}

	ctx.Status(http.StatusNoContent)
}
