package routes

import (
	"errors"
	"net/http"
	"time"

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

func PenaltyRoutes(router *gin.RouterGroup, database *gorm.DB) {
	router.GET("/penalty", models.WithDatabase(getAllPenalties, database))
	router.GET("/penalty/user/:id", models.WithDatabase(getAllPenaltiesForUser, database))
	router.GET("/penalty/:id", models.WithDatabase(getPenaltyWithID, database))
	router.POST("/penalty", models.WithDatabase(postPenalty, database))
}

func postPenalty(ctx *gin.Context, database *gorm.DB) {
	authentikUser, err := getAuthentikUser(ctx)
	if err != nil {
		ctx.JSON(401, gin.H{"error": err.Error()})

		return
	}

	// Check if user exists in database
	var user models.User
	if err := database.Where("email = ?", authentikUser.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create user if not exists
			user = models.User{Email: authentikUser.Email}
			if err := database.Create(&user).Error; err != nil {
				ctx.JSON(500, gin.H{"error": "failed to create user"})

				return
			}
		} else {
			ctx.JSON(500, gin.H{"error": "failed to fetch user"})

			return
		}
	}

	// Parse Penalty JSON
	var penalty PenaltyJSON
	if err := ctx.ShouldBindBodyWithJSON(&penalty); err != nil {
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
	if err := database.Create(&dbPenalty).Error; err != nil {
		ctx.JSON(500, gin.H{"error": "failed to create penalty"})

		return
	}

	ctx.Status(http.StatusCreated)
}

func getAllPenaltiesForUser(ctx *gin.Context, database *gorm.DB) {
	authentikUser, err := getAuthentikUser(ctx)
	if err != nil {
		ctx.JSON(401, gin.H{"error": err.Error()})

		return
	}

	// Get user from database
	var user models.User
	if err := database.Where("email = ?", authentikUser.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(404, gin.H{"error": "user not found"})

			return
		}

		ctx.JSON(500, gin.H{"error": "failed to fetch user"})

		return
	}

	var penalties []models.Penalty
	if err := database.
		Where("user_id = ?", user.ID).
		Preload("AssignedBy").
		Order("created_at DESC").
		Find(&penalties).Error; err != nil {
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
			AssignedAt: penalty.AssignedAt.Format("2006-01-02 15:04:05"),
		}
		penaltyList = append(penaltyList, penaltyJSON)
	}

	ctx.JSON(200, penaltyList)
}

func getAllPenalties(ctx *gin.Context, database *gorm.DB) {
	var penalties []models.Penalty
	if err := database.
		Preload("AssignedBy").
		Order("created_at DESC").
		Find(&penalties).Error; err != nil {
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
			AssignedAt: penalty.AssignedAt.Format("2006-01-02 15:04:05"),
		}
		penaltyList = append(penaltyList, penaltyJSON)
	}

	ctx.JSON(200, penaltyList)
}

func getPenaltyWithID(ctx *gin.Context, database *gorm.DB) {
	var penalty models.Penalty

	penaltyID := ctx.Param("id")
	if err := database.
		Where("id = ?", penaltyID).
		Preload("AssignedBy").
		Order("created_at DESC").
		First(&penalty).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(404, gin.H{"error": "dinner not found"})
		} else {
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
		AssignedAt: penalty.AssignedAt.Format("2006-01-02 15:04:05"),
	}

	ctx.JSON(200, penaltyJSON)
}
