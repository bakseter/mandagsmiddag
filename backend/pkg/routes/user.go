package routes

import (
	"net/http"
	"slices"

	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserJSON struct {
	ID      uint   `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name,omitempty"`
	IsAdmin bool   `json:"isAdmin,omitempty"`
}

func PutUser(c *gin.Context, database *gorm.DB) {
	authentikUser, err := getAuthentikUser(c)
	if err != nil {
		c.JSON(401, gin.H{"error": err.Error()})
		return
	}

	userIsAdmin := slices.Contains(
		authentikUser.Groups,
		"mandagsmiddag-admin",
	)

	// Upsert user in database
	var user models.User
	if err := database.Where("email = ?", authentikUser.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			newUser := models.User{
				Email:   authentikUser.Email,
				Name:    authentikUser.Username,
				IsAdmin: userIsAdmin,
			}

			if err := database.Create(&newUser).Error; err != nil {
				c.JSON(500, gin.H{"error": "failed to create user"})
				return
			}
		} else {
			c.JSON(500, gin.H{"error": "failed to fetch user"})
			return
		}
	} else {
		updatedUser := models.User{
			Name:    authentikUser.Username,
			IsAdmin: userIsAdmin,
		}

		if err := database.Model(&user).Updates(updatedUser).Error; err != nil {
			c.JSON(500, gin.H{"error": "failed to update user: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, UserJSON{
		ID:      user.ID,
		Email:   user.Email,
		Name:    user.Name,
		IsAdmin: user.IsAdmin,
	})
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
