package routes

import (
	"errors"
	"net/http"
	"time"

	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PenaltyJSON struct {
	ID         uint   `json:"id,omitempty"`
	UserID     uint   `json:"userId,omitempty"`
	Points     int    `json:"points,omitempty"`
	Reason     string `json:"reason,omitempty"`
	AssignedBy string `json:"assignedBy,omitempty"`
	AssignedAt string `json:"assignedAt,omitempty"`
}

func PenaltyRoutes(router *gin.RouterGroup, conf *config.Config) {
	router.GET("/penalty", config.WithConfig(getAllPenalties, conf))
	router.GET("/penalty/user/:id", config.WithConfig(getAllPenaltiesForUser, conf))
	router.GET("/penalty/:id", config.WithConfig(getPenaltyWithID, conf))
	router.POST("/penalty", config.WithConfig(postPenalty, conf))
}

func postPenalty(ctx *gin.Context, conf *config.Config) {
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
			// Create user if not exists
			user = models.User{Email: authentikUser.Email}
			if err := config.DB(ctx).Create(&user).Error; err != nil {
				config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to create user")
				ctx.JSON(500, gin.H{"error": "failed to create user"})

				return
			}
		} else {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch user")
			ctx.JSON(500, gin.H{"error": "failed to fetch user"})

			return
		}
	}

	if !user.IsAdmin {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("user not admin")
		ctx.JSON(403, gin.H{"error": "only admins can assign score adjustments"})

		return
	}

	// Parse Penalty JSON
	var penalty PenaltyJSON
	if err := ctx.ShouldBindBodyWithJSON(&penalty); err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to parse penalty json")
		ctx.JSON(400, gin.H{"error": err.Error()})

		return
	}

	// Create penalty model
	dbPenalty := models.Penalty{
		UserID:           penalty.UserID,
		AssignedByUserID: user.ID,
		Points:           penalty.Points,
		Reason:           penalty.Reason,
		AssignedAt:       time.Now(),
	}
	if err := config.DB(ctx).Create(&dbPenalty).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to create penalty")
		ctx.JSON(500, gin.H{"error": "failed to create penalty"})

		return
	}

	ctx.Status(http.StatusCreated)
}

func getAllPenaltiesForUser(ctx *gin.Context, conf *config.Config) {
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

	var penalties []models.Penalty
	if err := config.DB(ctx).
		Where("user_id = ?", user.ID).
		Preload("AssignedBy").
		Order("created_at DESC").
		Find(&penalties).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch penalties")
		ctx.JSON(500, gin.H{"error": "failed to fetch penalties"})

		return
	}

	if len(penalties) == 0 {
		ctx.JSON(200, []PenaltyJSON{})

		return
	}

	var penaltyList []PenaltyJSON

	for _, penalty := range penalties {
		penaltyJSON := PenaltyJSON{
			ID:         penalty.ID,
			UserID:     penalty.UserID,
			Points:     penalty.Points,
			Reason:     penalty.Reason,
			AssignedBy: penalty.AssignedBy.Email,
			AssignedAt: penalty.AssignedAt.Format("2006-01-02 15:04:05"), // TODO: what
		}
		penaltyList = append(penaltyList, penaltyJSON)
	}

	ctx.JSON(200, penaltyList)
}

func getAllPenalties(ctx *gin.Context, conf *config.Config) {
	var penalties []models.Penalty
	if err := config.DB(ctx).
		Preload("AssignedBy").
		Order("created_at DESC").
		Find(&penalties).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch penalties")
		ctx.JSON(500, gin.H{"error": "failed to fetch penalties"})

		return
	}

	if len(penalties) == 0 {
		ctx.JSON(200, []PenaltyJSON{})

		return
	}

	var penaltyList []PenaltyJSON

	for _, penalty := range penalties {
		penaltyJSON := PenaltyJSON{
			ID:         penalty.ID,
			UserID:     penalty.UserID,
			Points:     penalty.Points,
			Reason:     penalty.Reason,
			AssignedBy: penalty.AssignedBy.Email,
			AssignedAt: penalty.AssignedAt.Format("2006-01-02 15:04:05"), // TODO: what
		}
		penaltyList = append(penaltyList, penaltyJSON)
	}

	ctx.JSON(200, penaltyList)
}

func getPenaltyWithID(ctx *gin.Context, conf *config.Config) {
	var penalty models.Penalty

	penaltyID := ctx.Param("id")
	if err := config.DB(ctx).
		Where("id = ?", penaltyID).
		Preload("AssignedBy").
		Order("created_at DESC").
		First(&penalty).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("dinner not found")
			ctx.JSON(404, gin.H{"error": "dinner not found"})
		} else {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch dinner")
			ctx.JSON(500, gin.H{"error": "failed to fetch dinner"})
		}

		return
	}

	penaltyJSON := PenaltyJSON{
		ID:         penalty.ID,
		UserID:     penalty.UserID,
		Points:     penalty.Points,
		Reason:     penalty.Reason,
		AssignedBy: penalty.AssignedBy.Email,
		AssignedAt: penalty.AssignedAt.Format("2006-01-02 15:04:05"), // TODO: what
	}

	ctx.JSON(200, penaltyJSON)
}
