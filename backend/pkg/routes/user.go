package routes

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/bakseter/mandagsmiddag/pkg/config"
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

func UserRoutes(router *gin.RouterGroup, conf *config.Config) {
	router.GET("/user", config.WithConfig(getAllUsers, conf))
	router.PUT("/user", config.WithConfig(putUser, conf))
}

func getAllUsers(ctx *gin.Context, conf *config.Config) {
	var users []models.User
	if err := config.DB(ctx).Find(&users).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch users")
		ctx.JSON(500, gin.H{"error": "failed to fetch users"})

		return
	}

	dummyStr := ctx.Query("dummy")

	dummy, err := strconv.ParseBool(dummyStr)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Errorf("bad value for query parameter 'dummy': %s", dummyStr)
		ctx.JSON(400, gin.H{"error": fmt.Sprintf("bad value for query parameter 'dummy': %s'", dummyStr)})

		return
	}

	var userList []UserJSON

	for _, user := range users {
		// Ignore dummy user.
		//
		// They are used to signify a host that isn't an actual person,
		// e.g. the user named 'Kino' will host when going to the cinema.
		//
		// All dummy users have the email domain 'example.com'.
		if dummy || !strings.HasSuffix(user.Email, "@example.com") {
			userList = append(userList, UserJSON{
				ID:    user.ID,
				Email: user.Email,
				Name:  user.Name,
			})
		}
	}

	ctx.JSON(200, userList)
}

func putUser(ctx *gin.Context, conf *config.Config) { //nolint:funlen
	authentikUser, err := config.GetAuthentikUser(ctx)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("user not authenticated")
		ctx.JSON(401, gin.H{"error": err.Error()})

		return
	}

	userIsAdmin := authentikUser.IsAdmin()

	var user models.User

	selectUserErr := config.DB(ctx).Where("email = ?", authentikUser.Email).First(&user).Error

	// User not found
	if selectUserErr != nil && errors.Is(selectUserErr, gorm.ErrRecordNotFound) {
		newUser := models.User{
			Email:   authentikUser.Email,
			Name:    authentikUser.Username,
			IsAdmin: userIsAdmin,
		}

		// Create new user
		if createNewUserErr := config.DB(ctx).Create(&newUser).Error; createNewUserErr != nil {
			config.LoggerFrom(ctx, conf.Logger).WithError(createNewUserErr).Error("failed to create user")
			ctx.JSON(500, gin.H{"error": "failed to create user"})

			return
		}
	}

	// Other error
	if selectUserErr != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(selectUserErr).Error("failed to create user")
		ctx.JSON(500, gin.H{"error": "failed to fetch user"})

		return
	}

	// User found, update it if changed
	updatedUser := models.User{Name: authentikUser.Username, IsAdmin: userIsAdmin}

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

	if err := config.DB(ctx).Model(&user).Updates(updatedUser).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to update user")
		ctx.JSON(500, gin.H{"error": "failed to update user"})

		return
	}

	ctx.JSON(200, UserJSON{
		ID:      user.ID,
		Email:   user.Email,
		Name:    updatedUser.Name,
		IsAdmin: updatedUser.IsAdmin,
	})
}
