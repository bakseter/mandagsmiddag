package routes

import (
	"net/http"

	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RatingJSON struct {
	ID          uint     `json:"id,omitempty"`
	UserID      uint     `json:"user_id,omitempty"`
	FilmScore 	int 		 `json:"film_score,omitempty"`
	DinnerScore int 		 `json:"dinner_score,omitempty"`
	DinnerID 		uint 		 `json:"dinner_id,omitempty"`
}

func PostRating(c *gin.Context, database *gorm.DB) {
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

	// Parse rating JSON
	var rating RatingJSON
	if err := c.ShouldBindBodyWithJSON(&rating); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

		// Create rating model
	dbRating := models.Rating{
		UserID:      user.ID,
		DinnerID:    rating.DinnerID,
		FilmScore:   rating.FilmScore,
		DinnerScore: rating.DinnerScore,
	}
	if err := database.Create(&dbRating).Error; err != nil {
		c.JSON(500, gin.H{"error": "failed to create rating"})
		return
	}

	c.Status(http.StatusCreated)
	c.Header("HX-Trigger", "reload-ratings")
}

func GetAllRatings(c *gin.Context, database *gorm.DB) {
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

	var ratings []models.Rating
	if err := database.
		Where("user_id = ?", user.ID).
		Order("created_at DESC").
		Find(&ratings).Error; err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch ratings"})
		return
	}

	if len(ratings) == 0 {
		c.JSON(200, []RatingJSON{})
		return
	}

	var ratingList []RatingJSON
	for _, rating := range ratings {
		ratingJSON := RatingJSON{
			ID: rating.ID,
			UserID: rating.UserID,
			FilmScore: rating.FilmScore,
			DinnerScore: rating.DinnerScore,
			DinnerID: rating.DinnerID,
		}
		ratingList = append(ratingList, ratingJSON)
	}
	c.JSON(200, ratingList)
}