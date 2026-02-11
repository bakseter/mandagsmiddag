package routes

import (
	"net/http"

	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RatingJSON struct {
	ID          uint `json:"id,omitempty"`
	UserID      uint `json:"userId,omitempty"`
	FilmScore   int  `json:"filmScore,omitempty"`
	DinnerScore int  `json:"dinnerScore,omitempty"`
	DinnerID    uint `json:"dinnerId,omitempty"`
}

func PostRating(c *gin.Context, database *gorm.DB) {
	authentikUser, err := getAuthentikUser(c)
	if err != nil {
		c.JSON(401, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists in database
	var user models.User
	if err := database.Where("email = ?", authentikUser.Email).First(&user).Error; err != nil {
		c.JSON(401, gin.H{"error": "user does not exist: " + err.Error()})
		return
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
		c.JSON(500, gin.H{"error": "failed to create rating: " + err.Error()})
		return
	}

	c.Status(http.StatusCreated)
}

func GetAllRatingsForUser(c *gin.Context, database *gorm.DB) {
	authentikUser, err := getAuthentikUser(c)
	if err != nil {
		c.JSON(401, gin.H{"error": err.Error()})
		return
	}

	// Get user from database
	var user models.User
	if err := database.Where("email = ?", authentikUser.Email).First(&user).Error; err != nil {
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
			ID:          rating.ID,
			UserID:      rating.UserID,
			FilmScore:   rating.FilmScore,
			DinnerScore: rating.DinnerScore,
			DinnerID:    rating.DinnerID,
		}
		ratingList = append(ratingList, ratingJSON)
	}
	c.JSON(200, ratingList)
}

func GetAllRatings(c *gin.Context, database *gorm.DB) {
	var ratings []models.Rating
	if err := database.
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
			ID:          rating.ID,
			UserID:      rating.UserID,
			FilmScore:   rating.FilmScore,
			DinnerScore: rating.DinnerScore,
			DinnerID:    rating.DinnerID,
		}
		ratingList = append(ratingList, ratingJSON)
	}
	c.JSON(200, ratingList)
}

func GetRatingWithId(c *gin.Context, database *gorm.DB) {
	var rating models.Rating
	ratingId := c.Param("id")
	if err := database.
		Where("id = ?", ratingId).
		Order("created_at DESC").
		First(&rating).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(404, gin.H{"error": "dinner not found"})
		} else {
			c.JSON(500, gin.H{"error": "failed to fetch dinner"})
		}
		return
	}

	ratingJSON := RatingJSON{
		ID:          rating.ID,
		UserID:      rating.UserID,
		FilmScore:   rating.FilmScore,
		DinnerScore: rating.DinnerScore,
		DinnerID:    rating.DinnerID,
	}

	c.JSON(200, ratingJSON)
}
