package routes

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MessageJSON struct {
	ID         uint   `json:"id"`
	SenderID   uint   `json:"senderId"`
	SenderName string `json:"senderName"`
	Body       string `json:"body"`
	CreatedAt  string `json:"createdAt"`
}

type PostMessageJSON struct {
	Body string `json:"body"`
}

func MessageRoutes(router *gin.RouterGroup, conf *config.Config) {
	router.GET("/message", config.WithConfig(getMessages, conf))
	router.POST("/message", config.WithConfig(postMessage, conf))
}

// currentDBUser resolves the authenticated Authentik user to a database user.
// If ok is false, an error response has already been written.
func currentDBUser(ctx *gin.Context, conf *config.Config) (*models.User, bool) {
	authentikUser, err := config.GetAuthentikUser(ctx)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("user not authenticated")
		ctx.JSON(401, gin.H{"error": err.Error()})

		return nil, false
	}

	var user models.User
	if err := config.DB(ctx).Where("email = ?", authentikUser.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("user not found in database")
			ctx.JSON(401, gin.H{"error": "user not found in database"})
		} else {
			config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch user")
			ctx.JSON(500, gin.H{"error": "failed to fetch user"})
		}

		return nil, false
	}

	return &user, true
}

func toMessageJSON(message models.Message) MessageJSON {
	return MessageJSON{
		ID:         message.ID,
		SenderID:   message.SenderID,
		SenderName: message.Sender.Name,
		Body:       message.Body,
		CreatedAt:  message.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func getMessages(ctx *gin.Context, conf *config.Config) {
	if _, ok := currentDBUser(ctx, conf); !ok {
		return
	}

	var messages []models.Message

	err := config.DB(ctx).
		Preload("Sender").
		Order("created_at ASC").
		Limit(500).
		Find(&messages).Error
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to fetch messages")
		ctx.JSON(500, gin.H{"error": "failed to fetch messages"})

		return
	}

	messageList := make([]MessageJSON, 0, len(messages))
	for _, message := range messages {
		messageList = append(messageList, toMessageJSON(message))
	}

	ctx.JSON(200, messageList)
}

func postMessage(ctx *gin.Context, conf *config.Config) {
	user, ok := currentDBUser(ctx, conf)
	if !ok {
		return
	}

	var postMessage PostMessageJSON
	if err := ctx.ShouldBindJSON(&postMessage); err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to parse message json")
		ctx.JSON(400, gin.H{"error": err.Error()})

		return
	}

	if strings.TrimSpace(postMessage.Body) == "" {
		ctx.JSON(400, gin.H{"error": "message body is empty"})

		return
	}

	message := models.Message{
		SenderID: user.ID,
		Body:     postMessage.Body,
	}

	if err := config.DB(ctx).Create(&message).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to create message")
		ctx.JSON(500, gin.H{"error": "failed to create message"})

		return
	}

	if err := config.DB(ctx).Preload("Sender").First(&message, message.ID).Error; err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to reload message sender")
		ctx.JSON(500, gin.H{"error": "failed to fetch message"})

		return
	}

	ctx.JSON(http.StatusCreated, toMessageJSON(message))
}
