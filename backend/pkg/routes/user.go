package routes

import (
	"errors"
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

func UserRoutes(router *gin.RouterGroup, database *gorm.DB) {
	router.GET("/user", models.WithDatabase(getAllUsers, database))
	router.PUT("/user", models.WithDatabase(putUser, database))
}

func getAllUsers(ctx *gin.Context, database *gorm.DB) {
	var users []models.User
	if err := database.Find(&users).Error; err != nil {
		ctx.JSON(500, gin.H{"error": "failed to fetch users"})

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

	ctx.JSON(http.StatusOK, userList)
}

func putUser(ctx *gin.Context, database *gorm.DB) {
	authentikUser, err := getAuthentikUser(ctx)
	if err != nil {
		ctx.JSON(401, gin.H{"error": err.Error()})

		return
	}

	userIsAdmin := slices.Contains(
		authentikUser.Groups,
		"mandagsmiddag-admin",
	)

	var user models.User

	selectUserErr := database.Where("email = ?", authentikUser.Email).First(&user).Error

	// User not found
	if selectUserErr != nil && errors.Is(selectUserErr, gorm.ErrRecordNotFound) {
		newUser := models.User{
			Email:   authentikUser.Email,
			Name:    authentikUser.Username,
			IsAdmin: userIsAdmin,
		}

		// Create new user
		if createNewUserErr := database.Create(&newUser).Error; createNewUserErr != nil {
			ctx.JSON(500, gin.H{"error": "failed to create user: " + createNewUserErr.Error()})

			return
		}
	}

	// Other error
	if selectUserErr != nil {
		ctx.JSON(500, gin.H{"error": "failed to fetch user: " + selectUserErr.Error()})

		return
	}

	// User found, update it if changed
	updatedUser := models.User{
		Name:    authentikUser.Username,
		IsAdmin: userIsAdmin,
	}

	// Not changed
	if user.Name == updatedUser.Name && user.IsAdmin == updatedUser.IsAdmin {
		ctx.JSON(http.StatusOK, UserJSON{
			ID:      user.ID,
			Email:   user.Email,
			Name:    user.Name,
			IsAdmin: user.IsAdmin,
		})

		return
	}

	if err := database.Model(&user).Updates(updatedUser).Error; err != nil {
		ctx.JSON(500, gin.H{"error": "failed to update user: " + err.Error()})

		return
	}

	ctx.JSON(http.StatusOK, UserJSON{
		ID:      user.ID,
		Email:   user.Email,
		Name:    updatedUser.Name,
		IsAdmin: updatedUser.IsAdmin,
	})
}
