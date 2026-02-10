package routes

import (
	"net/http"

	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserJSON struct {
	ID    uint   `json:"id,omitempty"`
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

func GetAllUsers(c *gin.Context, database *gorm.DB) {
	var users []models.User
	if err := database.Find(&users).Error; err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch users"})
		return
	}

	var userList []UserJSON
	for _, user := range users {
		userList = append(userList, UserJSON{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		})
	}

	c.JSON(http.StatusOK, userList)
}
