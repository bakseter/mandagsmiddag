package routes

import (
	"net/http"
	"time"

	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PenaltyJSON struct {
	ID         uint     `json:"id,omitempty"`
	UserID     uint     `json:"user_id,omitempty"`
	Points 		 int 		  `json:"points,omitempty"`
	Reason 		 string 	`json:"reason,omitempty"`
	AssignedBy string   `json:"assigned_by,omitempty"`
	AssignedAt string		`json:"assigned_at,omitempty"`
}

func PostPenalty(c *gin.Context, database *gorm.DB) {
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

	// Parse Penalty JSON
	var penalty PenaltyJSON
	if err := c.ShouldBindBodyWithJSON(&penalty); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

		// Create penalty model
	dbPenalty := models.Penalty{
    UserID: penalty.UserID,
    AssignedByUserID: user.ID,
    Points: penalty.Points,
    Reason: penalty.Reason,
    AssignedAt: time.Now(),
	}
	if err := database.Create(&dbPenalty).Error; err != nil {
		c.JSON(500, gin.H{"error": "failed to create penalty"})
		return
	}

	c.Status(http.StatusCreated)
	c.Header("HX-Trigger", "reload-penalties")
}

func GetAllPenalties(c *gin.Context, database *gorm.DB) {
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

	var penalties []models.Penalty
	if err := database.
		Where("user_id = ?", user.ID).
		Preload("AssignedBy").
		Order("created_at DESC").
		Find(&penalties).Error; err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch penalties"})
		return
	}

	if len(penalties) == 0 {
		c.JSON(200, []PenaltyJSON{})
		return
	}

	var penaltyList []PenaltyJSON
	for _, penalty := range penalties {
		penaltyJSON := PenaltyJSON{
			ID: penalty.ID,
			UserID: penalty.UserID,
			Points: penalty.Points,
			Reason: penalty.Reason,
			AssignedBy: penalty.AssignedBy.Email,
			AssignedAt: penalty.AssignedAt.Format("2006-01-02 15:04:05"),
		}
		penaltyList = append(penaltyList, penaltyJSON)
	}
	c.JSON(200, penaltyList)
}