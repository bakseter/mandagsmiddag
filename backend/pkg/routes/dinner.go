package routes

import (
	"net/http"
	"time"

	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DinnerJSON struct {
	ID             uint     `json:"id,omitempty"`
	HostUserID     uint     `json:"host_user_id,omitempty"`
	ParticipantIDs []uint   `json:"participant_ids,omitempty"`
	Date           string   `json:"date,omitempty"`
	Food           string   `json:"food,omitempty"`
	FilmIMDBUrl    string   `json:"film_imdb_url,omitempty"`  // Changed from FilmID
	FilmTitle      string   `json:"film_title,omitempty"`      // Added
}

func PostDinner(c *gin.Context, database *gorm.DB) {
	userInfo, err := getUserInfo(c)
	if err != nil {
		c.JSON(401, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists in database
	var user models.User
	if err := database.Where("email = ?", userInfo.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create user if not exists
			user = models.User{Email: userInfo.Email}
			if err := database.Create(&user).Error; err != nil {
				c.JSON(500, gin.H{"error": "failed to create user"})
				return
			}
		} else {
			c.JSON(500, gin.H{"error": "failed to fetch user"})
			return
		}
	}

	// Parse dinner JSON
	var dinner DinnerJSON
	if err := c.ShouldBindJSON(&dinner); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Parse date string to time.Time
	parsedDate, err := time.Parse(time.RFC3339, dinner.Date)
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid date format, use ISO 8601 (RFC3339)"})
		return
	}

	// Handle film: find existing or create new
	var film models.Film
	var filmID *uint

	if dinner.FilmIMDBUrl != "" {
		// Try to find existing film by IMDB URL
		err := database.Where("imdb_url = ?", dinner.FilmIMDBUrl).First(&film).Error
		
		if err == gorm.ErrRecordNotFound {
			// Film doesn't exist, create it
			if dinner.FilmTitle == "" {
				c.JSON(400, gin.H{"error": "film_title is required when creating a new film"})
				return
			}

			film = models.Film{
				Title:   dinner.FilmTitle,
				IMDBUrl: dinner.FilmIMDBUrl,
			}

			if err := database.Create(&film).Error; err != nil {
				c.JSON(500, gin.H{"error": "failed to create film"})
				return
			}
			
			filmID = &film.ID
		} else if err != nil {
			// Database error
			c.JSON(500, gin.H{"error": "failed to fetch film"})
			return
		} else {
			// Film exists
			filmID = &film.ID
		}
	}
	// If FilmIMDBUrl is empty, filmID remains nil (no film selected)

	// Create dinner model
	dbDinner := models.Dinner{
		HostUserID: user.ID,
		Date:       parsedDate,
		Food:       dinner.Food,
		FilmID:     filmID,
	}

	// Add participants if provided
	if len(dinner.ParticipantIDs) > 0 {
		var participants []models.User
		if err := database.Where("id IN ?", dinner.ParticipantIDs).Find(&participants).Error; err != nil {
			c.JSON(500, gin.H{"error": "failed to fetch participants"})
			return
		}
		
		if len(participants) != len(dinner.ParticipantIDs) {
			c.JSON(400, gin.H{"error": "one or more participant IDs not found"})
			return
		}
		
		dbDinner.Participants = participants
	}

	if err := database.Create(&dbDinner).Error; err != nil {
		c.JSON(500, gin.H{"error": "failed to create dinner"})
		return
	}

	c.Status(http.StatusCreated)
	c.Header("HX-Trigger", "reload-dinners")
}

func GetAllDinners(c *gin.Context, database *gorm.DB) {
	userInfo, err := getUserInfo(c)
	if err != nil {
		c.JSON(401, gin.H{"error": err.Error()})
		return
	}

	// Get user from database
	var user models.User
	if err := database.Where("email = ?", userInfo.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(404, gin.H{"error": "user not found"})
			return
		} else {
			c.JSON(500, gin.H{"error": "failed to fetch user"})
			return
		}
	}

	var dinners []models.Dinner
	if err := database.
		Where("host_user_id = ?", user.ID).
		Preload("Participants").
		Preload("Film").
		Order("date DESC").
		Find(&dinners).Error; err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch dinners"})
		return
	}

	if len(dinners) == 0 {
		c.JSON(200, []DinnerJSON{})
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

	c.JSON(200, dinnerList)
}