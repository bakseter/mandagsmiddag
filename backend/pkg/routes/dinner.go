package routes

import (
	"errors"
	"time"

	"github.com/bakseter/mandagsmiddag/pkg/config"
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

func DinnerRoutes(router *gin.RouterGroup, conf *config.Config) {
	router.GET("/dinner", config.WithConfig(getAllDinners, conf))
	router.GET("/dinner/host/:id", config.WithConfig(getAllDinnersForUser, conf))
	router.GET("dinner/:id", config.WithConfig(getDinnerWithID, conf))
	router.PUT("/dinner", config.WithConfig(putDinner, conf))
	router.DELETE("/dinner/:id", config.WithConfig(deleteDinnerWithID, conf))
}

func putDinner(ctx *gin.Context, conf *config.Config) { //nolint:gocognit,cyclop,funlen
	authentikUser, err := config.GetAuthentikUser(ctx)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("user not authenticated")
		ctx.JSON(401, gin.H{"error": err.Error()})

		return
	}

	// Check if user exists in database
	var user models.User
	if err := config.DB(ctx).Where("email = ?", authentikUser.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("user not found in database")
			ctx.JSON(401, gin.H{"error": "user not found in database"})

			return
		}

		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch user")
		ctx.JSON(500, gin.H{"error": "failed to fetch user"})

		return
	}

	// Parse dinner JSON
	var dinnerJSON DinnerJSON
	if err := ctx.ShouldBindJSON(&dinnerJSON); err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to parse dinner json")
		ctx.JSON(400, gin.H{"error": err.Error()})

		return
	}

	// Parse date string to time.Time
	parsedDate, err := time.Parse(time.RFC3339, dinnerJSON.Date)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to parse dinner date")
		ctx.JSON(400, gin.H{"error": "invalid date format, use ISO 8601 (RFC3339)"})

		return
	}

	var hostUser models.User
	if err := config.DB(ctx).Where("id = ?", dinnerJSON.HostUserID).First(&hostUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("host user not found")
			ctx.JSON(400, gin.H{"error": "host user not found"})

			return
		}

		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch host user")
		ctx.JSON(500, gin.H{"error": "failed to fetch host user"})

		return
	}

	if hostUser.ID != user.ID && !user.IsAdmin {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error(
			"non-admin users can only create or update dinners when they are the host",
		)
		ctx.JSON(403, gin.H{"error": "non-admin users can only create or update dinners where they are the host"})

		return
	}

	// Handle film: find existing or create new
	var (
		film   models.Film
		filmID *uint
	)

	normalizedIMDBUrl, err := models.NormalizeIMDBUrl(dinnerJSON.FilmIMDBUrl)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("invalid IMDB URL format")
		ctx.JSON(400, gin.H{"error": "invalid IMDB URL format"})

		return
	}

	if normalizedIMDBUrl != "" { //nolint:nestif
		// Try to find existing film by IMDB URL
		err := config.DB(ctx).Where("imdb_url = ?", normalizedIMDBUrl).First(&film).Error

		if errors.Is(err, gorm.ErrRecordNotFound) { //nolint:gocritic
			// Film doesn't exist, create it
			if dinnerJSON.FilmTitle == "" {
				config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("title is required when creating a new film")
				ctx.JSON(400, gin.H{"error": "title is required when creating a new film"})

				return
			}

			film = models.Film{
				Title:   dinnerJSON.FilmTitle,
				IMDBUrl: normalizedIMDBUrl,
			}

			if err := config.DB(ctx).Create(&film).Error; err != nil {
				config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to create film")
				ctx.JSON(500, gin.H{"error": "failed to create film"})

				return
			}

			filmID = &film.ID
		} else if err != nil {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch film")
			ctx.JSON(500, gin.H{"error": "failed to fetch film"})

			return
		} else {
			// Film exists
			filmID = &film.ID
		}
	}
	// If FilmIMDBUrl is empty, filmID remains nil (no film selected)

	var participants []models.User
	if err := config.DB(ctx).Where("id IN ?", dinnerJSON.ParticipantIDs).Find(&participants).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch participants")
		ctx.JSON(500, gin.H{"error": "failed to fetch participants"})

		return
	}

	if len(participants) != len(dinnerJSON.ParticipantIDs) {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("one or more participants IDs not found")
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
		if err := config.DB(ctx).Where("id = ?", dinnerJSON.ID).First(&existingDinner).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("dinner not found for update")
				ctx.JSON(404, gin.H{"error": "dinner not found for update"})

				return
			}

			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch existing dinner for update")
			ctx.JSON(500, gin.H{"error": "failed to fetch existing dinner for update"})

			return
		}

		dbDinner.ID = existingDinner.ID

		// Update scalar fields first
		if err := config.DB(ctx).Model(&existingDinner).Updates(dbDinner).Error; err != nil {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to update dinner")
			ctx.JSON(500, gin.H{"error": "failed to update dinner"})

			return
		}

		// Then replace participants explicitly
		if err := config.DB(ctx).Model(&existingDinner).
			Association("Participants").
			Replace(participants); err != nil {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to update participants")
			ctx.JSON(500, gin.H{"error": "failed to update participants"})

			return
		}

		ctx.JSON(200, gin.H{"message": "dinner updated successfully"})

		return
	}

	// Create new dinner
	if err := config.DB(ctx).Create(&dbDinner).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to create dinner")
		ctx.JSON(500, gin.H{"error": "failed to create dinner"})

		return
	}

	ctx.JSON(201, gin.H{"message": "dinner created successfully"})
}

func getAllDinners(ctx *gin.Context, conf *config.Config) {
	var dinners []models.Dinner
	if err := config.DB(ctx).
		Preload("Participants", func(db *gorm.DB) *gorm.DB {
			return db.Select("id")
		}).
		Preload("Film").
		Order("date DESC").
		Find(&dinners).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch dinners")
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

func getAllDinnersForUser(ctx *gin.Context, conf *config.Config) {
	var dinners []models.Dinner

	hostID := ctx.Param("id")
	if err := config.DB(ctx).
		Where("host_user_id = ?", hostID).
		Preload("Participants", func(db *gorm.DB) *gorm.DB {
			return db.Select("id")
		}).
		Preload("Film").
		Order("date DESC").
		Find(&dinners).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch dinners")
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

func getDinnerWithID(ctx *gin.Context, conf *config.Config) {
	dinnerID := ctx.Param("id")

	var dinner models.Dinner
	if err := config.DB(ctx).Where("id = ?", dinnerID).
		Preload("Participants", func(db *gorm.DB) *gorm.DB {
			return db.Select("id")
		}).
		Preload("Film").
		First(&dinner).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("dinner not found")
			ctx.JSON(404, gin.H{"error": "dinner not found"})
		} else {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch dinner")
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

func deleteDinnerWithID(ctx *gin.Context, conf *config.Config) {
	dinnerID := ctx.Param("id")
	if err := config.DB(ctx).Delete(&models.Dinner{}, dinnerID).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to delete dinner")
		ctx.JSON(500, gin.H{"error": "failed to delete dinner"})

		return
	}

	ctx.Status(204)
}
