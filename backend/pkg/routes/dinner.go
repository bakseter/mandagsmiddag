package routes

import (
	"net/http"
	"slices"

	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DinnerJSON struct {
	ID             uint   `json:"id,omitempty"`
	HostUserID     uint   `json:"host_user_id,omitempty"`
	ParticipantIDs []uint `json:"participant_ids,omitempty"`
	Date           string `json:"date,omitempty"`
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

	// User exists, proceed with dinner creation
	var dinner DinnerJSON
	if err := c.ShouldBindJSON(&dinner); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})

		return
	}

	dbDinner := models.Dinner{
		HostUserID: user.ID,
		Date:       dinner.Date,
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
	if err := database.Where("user_id = ?", user.ID).Find(&dinners).Error; err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch dinners"})

		return
	}

	if len(dinners) == 0 {
		c.JSON(200, []DinnerJSON{})

		return
	}

	var dinnerList []DinnerJSON
	for _, dinner := range dinners {
		dinnerList = append(dinnerList, DinnerJSON{
			ID:         dinner.ID,
			HostUserID: dinner.HostUserID,
			Date:       dinner.Date,
		})
	}

	slices.Reverse(dinnerList)

	c.JSON(200, dinnerList)
}

/*
func DeleteTransaction(c *gin.Context, database *gorm.DB) {
	userInfo, err := getUserInfo(c)
	if err != nil {
		c.JSON(401, gin.H{"error": err.Error()})
		return
	}

	var transaction models.Transaction
	if err := database.Where("id = ?", c.Param("id")).First(&transaction).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(404, gin.H{"error": "transaction not found"})

			return
		} else {
			c.JSON(500, gin.H{"error": "failed to fetch transaction"})

			return
		}
	}

	// Check if the user owns the transaction
	var user models.User
	if err := database.Where("id = ?", transaction.UserID).First(&user).Error; err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch user"})

		return
	}

	if user.Email != userInfo.Email {
		c.JSON(403, gin.H{"error": "forbidden"})

		return
	}

	// Delete the transaction
	if err := database.Delete(&transaction).Error; err != nil {
		c.JSON(500, gin.H{"error": "failed to delete transaction"})

		return
	}

	c.Header("HX-Trigger", "reload-transactions")
	c.Status(http.StatusNoContent)
}
*/
