package routes

import (
	"errors"
	"net/http"

	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RatingJSON struct {
	ID          uint `json:"id,omitempty"`
	UserID      uint `json:"userId,omitempty"`
	FilmScore   int  `json:"filmScore,omitempty"`
	DinnerScore *int `json:"dinnerScore"`
	DinnerID    uint `json:"dinnerId,omitempty"`
}

func RatingRoutes(router *gin.RouterGroup, conf *config.Config) {
	router.GET("/rating", config.WithConfig(getAllRatings, conf))
	router.GET("/rating/user", config.WithConfig(getAllRatingsForUser, conf))
	router.GET("/rating/:id", config.WithConfig(getRatingWithID, conf))
	router.PUT("/rating", config.WithConfig(putRating, conf))
}

func putRating(ctx *gin.Context, conf *config.Config) { //nolint:cyclop,funlen
	authentikUser, err := config.GetAuthentikUser(ctx)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("user not authenticated")
		ctx.JSON(401, gin.H{"error": err.Error()})

		return
	}

	// Check if user exists in database
	var user models.User
	if err := config.DB(ctx).Where("email = ?", authentikUser.Email).First(&user).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("user does not exist")
		ctx.JSON(401, gin.H{"error": "user does not exist: " + err.Error()})

		return
	}

	// Parse rating JSON
	var rating RatingJSON
	if err := ctx.ShouldBindBodyWithJSON(&rating); err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed parsing rating json")
		ctx.JSON(400, gin.H{"error": err.Error()})

		return
	}

	if rating.UserID != 0 && rating.UserID != user.ID && !user.IsAdmin {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error(
			"cannot create or update rating for another user unless admin",
		)
		ctx.JSON(403, gin.H{"error": "cannot create or update rating for another user unless admin"})

		return
	}

	// If admin, override userID with rating.UserID if provided, otherwise use authenticated user's ID
	userID := func() uint {
		if user.IsAdmin && rating.UserID != 0 {
			return rating.UserID
		}

		return user.ID
	}()

	// Create rating model
	dbRating := models.Rating{
		UserID:      userID,
		DinnerID:    rating.DinnerID,
		FilmScore:   rating.FilmScore,
		DinnerScore: rating.DinnerScore,
	}

	// Set ID if exists, to ensure update to correct Rating
	if rating.ID > 0 {
		dbRating.ID = rating.ID
	}

	// Set FilmScore if it exists, to ensure update
	if rating.FilmScore > 0 {
		dbRating.FilmScore = rating.FilmScore
	}

	// Upsert by (user_id, dinner_id): update if exists, create if not
	var existingRating models.Rating

	err = config.DB(ctx).Where(
		"user_id = ? AND dinner_id = ?",
		dbRating.UserID,
		dbRating.DinnerID,
	).First(&existingRating).Error

	switch {
	case err == nil:
		existingRating.FilmScore = dbRating.FilmScore

		existingRating.DinnerScore = dbRating.DinnerScore
		if err := config.DB(ctx).Save(&existingRating).Error; err != nil {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to update rating")
			ctx.JSON(500, gin.H{"error": "failed to update rating: " + err.Error()})

			return
		}

		ctx.Status(http.StatusOK)

		return
	case errors.Is(err, gorm.ErrRecordNotFound):
		if err := config.DB(ctx).Create(&dbRating).Error; err != nil {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to create rating")
			ctx.JSON(500, gin.H{"error": "failed to create rating: " + err.Error()})

			return
		}

		ctx.Status(http.StatusCreated)

		return
	default:
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to check existing rating")
		ctx.JSON(500, gin.H{"error": "failed to check existing rating: " + err.Error()})

		return
	}
}

func getAllRatingsForUser(ctx *gin.Context, conf *config.Config) {
	authentikUser, err := config.GetAuthentikUser(ctx)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("user not authenticated")
		ctx.JSON(401, gin.H{"error": err.Error()})

		return
	}

	// Get user from database
	var user models.User
	if err := config.DB(ctx).Where("email = ?", authentikUser.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("user not found")
			ctx.JSON(404, gin.H{"error": "user not found"})

			return
		}

		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch user")
		ctx.JSON(500, gin.H{"error": "failed to fetch user"})

		return
	}

	var ratings []models.Rating
	if err := config.DB(ctx).
		Where("user_id = ?", user.ID).
		Order("created_at DESC").
		Find(&ratings).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch ratings")
		ctx.JSON(500, gin.H{"error": "failed to fetch ratings"})

		return
	}

	if len(ratings) == 0 {
		ctx.JSON(200, []RatingJSON{})

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

	ctx.JSON(200, ratingList)
}

func getAllRatings(ctx *gin.Context, conf *config.Config) {
	var ratings []models.Rating
	if err := config.DB(ctx).
		Order("created_at DESC").
		Find(&ratings).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch ratings")
		ctx.JSON(500, gin.H{"error": "failed to fetch ratings"})

		return
	}

	if len(ratings) == 0 {
		ctx.JSON(200, []RatingJSON{})

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

	ctx.JSON(200, ratingList)
}

func getRatingWithID(ctx *gin.Context, conf *config.Config) {
	var rating models.Rating

	ratingID := ctx.Param("id")
	if err := config.DB(ctx).
		Where("id = ?", ratingID).
		Order("created_at DESC").
		First(&rating).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("dinner not found")
			ctx.JSON(404, gin.H{"error": "dinner not found"})
		} else {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch dinner")
			ctx.JSON(500, gin.H{"error": "failed to fetch dinner"})
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

	ctx.JSON(200, ratingJSON)
}
