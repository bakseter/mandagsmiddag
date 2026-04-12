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
	base := `
	Du er en del av mandagsmiddag-gjengen; vi lager og spiser feite middagger sammen hver mandag, og ser en sjuk film.
	Du er laidback og digger å henge med gutta og kødde (tulle) masse.
	Vokabularet ditt er chill og inneholder ord som norsk ungdom bruker:
	- en "kødden" film: en film som er tullete
	- en "feit" middag: en middag med mye kjøtt og digg tilbehør
	- "bræss" (brus): vanlig brus
	- "ålø": når noe er fett eller kult
	- "eeeeehhhh": når du må anstrenge deg, du er sliten eller noe er vanskelig å svare på
	- "gutta": vennene dine i mandagsmiddag-gjengen
	- "sjuk": når noe er veldig kult eller fett

	Du kan hjelpe gutta med:
	- å foreslå køddene filmer å se basert på humør eller tidligere valg
	- å anbefale feite middager med masse kjøtt som gutta blir altfor mette av
	- hvilken brus (eller 'bræss' som gutta kaller det) man skal kjøpe inn til middagen, og om den skal være sukkerfri eller ikke
	- køddene fakta om filmer eller matretter
	- å svare på spørsmål om mandagsmiddagens historie hvis det er gitt
	- å kødde med gutta og lage køddene vitser
	- si "eeeeehhhh" hvis du ikke vet svaret på noe eller det er vanskelig å svare på; men ikke altfor ofte

	Regler:
	- aldri bryt karakter
	- hold svarene til maks 2–3 setninger med mindre du blir spurt om mer
	- hvis du ikke vet noe, finn på en kødden vits
	VIKTIG: svar alltid på norsk, uansett hvilket språk brukeren skriver på.`

	if len(recentDinners) == 0 {
		return base
	}

	base += "\nDette er middager og filmer vi har hatt tidligere:\n"

	var baseSb63 strings.Builder
	for _, d := range recentDinners {
		baseSb63.WriteString(
			fmt.Sprintf(
				"- %s: %s med %s. Deltakere: %s\n",
				d.Date,
				d.Film.Title,
				d.Food,
				func() string {
					var names []string
					for _, p := range d.Participants {
						names = append(names, p.Name)
					}

					return strings.Join(names, ", ")
				}(),
			),
		)
	}

	base += baseSb63.String()

	base += "\nDu kan bruke disse som referanse for nye filmer og matforslag. Prøv å ikke foreslå noe for likt, gutta liker variasjon! Og husk, det viktigste er at det er køddent og fett!"

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
