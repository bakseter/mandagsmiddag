package routes

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
}

type ChatResponse struct {
	Message struct {
		Content string `json:"content"`
	} `json:"message"`
	Done bool `json:"done"`
}

func ChatRoutes(router *gin.RouterGroup, database *gorm.DB, conf *config.Config) {
	router.POST("/chat", models.WithDatabaseAndConfig(postChat, database, conf))
}

func buildSystemPrompt(recentDinners []models.Dinner) string {
	base := `Du er maskoten for Mandagsmiddag - en vennegjeng som spiser middag og ser film sammen hver mandag

Du kan hjelpe med:
- Å foreslå filmer å se basert på humør eller tidligere valg
- Å anbefale mat/retter som passer godt til filmens tema
- Morsomme fakta om filmer eller matretter
- Å svare på spørsmål om klubbens historie hvis det er gitt

Regler:
- Aldri bryt karakter
- Hold svarene til maks 2–3 setninger med mindre du blir spurt om mer
- Hvis du ikke vet noe, lag en lettvint vits om det

VIKTIG: Svar alltid på norsk, uansett hvilket språk brukeren skriver på.`

	if len(recentDinners) == 0 {
		return base
	}

	base += "\n\nTidligere middager:\n"

	var baseSb63 strings.Builder
	for _, d := range recentDinners {
		baseSb63.WriteString(fmt.Sprintf("- %s: %s med %s\n", d.Date, d.Film.Title, d.Food))
	}

	base += baseSb63.String()

	base += "\nDu kan bruke disse som referanse for nye filmer og matforslag."

	return base
}

func postChat(ctx *gin.Context, database *gorm.DB, conf *config.Config) { //nolint:cyclop,funlen
	// Set headers BEFORE writing any body
	ctx.Writer.Header().Set("Content-Type", "text/event-stream")
	ctx.Writer.Header().Set("Cache-Control", "no-cache")
	ctx.Writer.Header().Set("Connection", "keep-alive")
	ctx.Writer.Header().Set("X-Accel-Buffering", "no") // disables nginx buffering if behind proxy
	ctx.Writer.WriteHeader(http.StatusOK)              // flush headers immediately
	ctx.Writer.Flush()

	var req ChatRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return
	}

	var recentDinners []models.Dinner
	if err := database.
		Preload("Participants", func(db *gorm.DB) *gorm.DB {
			return db.Select("id")
		}).
		Preload("Film").
		Order("date DESC").
		Limit(5).
		Find(&recentDinners).Error; err != nil {
		ctx.JSON(500, gin.H{"error": "failed to fetch dinners"})

		return
	}

	messages := append([]Message{{
		Role:    "system",
		Content: buildSystemPrompt(recentDinners),
	}}, req.Messages...)

	payload, err := json.Marshal(map[string]any{
		"model":    conf.OllamaModel,
		"messages": messages,
		"stream":   true,
		"options": map[string]any{
			"num_ctx":        512,
			"num_predict":    200,
			"temperature":    0.9,
			"repeat_penalty": 1.1,
		},
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to marshal request"})

		return
	}

	log.Infof(
		"Forwarding chat request to Ollama: %s",
		payload,
	)

	resp, err := http.Post(conf.OllamaEndpoint+"/api/chat", "application/json", bytes.NewReader(payload))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "ollama unreachable"})

		return
	}
	defer resp.Body.Close()

	ctx.Writer.Header().Set("Content-Type", "text/event-stream")
	ctx.Writer.Header().Set("Cache-Control", "no-cache")
	ctx.Writer.Header().Set("Connection", "keep-alive")

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		var chunk struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
			Done bool `json:"done"`
		}
		if err := json.Unmarshal(line, &chunk); err != nil {
			log.Warnf("Failed to parse chunk from Ollama: %s", line)

			continue
		}

		data, err := json.Marshal(map[string]any{
			"content": chunk.Message.Content,
			"done":    chunk.Done,
		})
		if err != nil {
			log.Warnf("Failed to marshal chunk for client: %v", err)

			continue
		}

		fmt.Fprintf(ctx.Writer, "data: %s\n\n", data)
		ctx.Writer.Flush()

		if chunk.Done {
			break
		}
	}

	if err := scanner.Err(); err != nil && !errors.Is(err, io.EOF) {
		fmt.Fprintf(ctx.Writer, "data: %s\n\n", `{"error":"stream interrupted","done":true}`)
		ctx.Writer.Flush()
	}
}
