package main

import (
	"context"
	"log"

	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/bakseter/mandagsmiddag/pkg/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"gorm.io/gorm"
)

func main() {
	ctx := context.Background()

	conf, err := config.New(ctx)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	router := gin.New()
	router.Use(gin.LoggerWithWriter(gin.DefaultWriter, "/metrics"))
	router.Use(config.ConfigureGinMetrics(conf))
	router.SetTrustedProxies(nil)

	if !conf.Local {
		gin.SetMode(gin.ReleaseMode)
	}

	headers := []string{
		"Origin",
		"Content-Type",
		"Accept",
		"Authorization",
		"X-authentik-username",
		"X-authentik-groups",
		"X-authentik-entitlements",
		"X-authentik-email",
		"X-authentik-name",
		"X-authentik-uid",
	}

	if conf.Local {
		// Local CORS - permissive
		router.Use(cors.New(cors.Config{
			AllowOrigins: []string{"http://localhost:3000", "http://localhost:5173"},
			AllowMethods: []string{"GET", "PATCH", "PUT", "POST", "DELETE"},
			AllowHeaders: headers,
		}))
	} else {
		// Production CORS - restrictive
		router.Use(cors.New(cors.Config{
			AllowOrigins: []string{conf.Host},
			AllowMethods: []string{"GET", "PATCH", "PUT", "POST", "DELETE"},
			AllowHeaders: headers,
		}))
	}

	database, err := models.InitializeDatabase()
	if err != nil {
		log.Fatal(err)
	}

	err = database.AutoMigrate(
		&models.User{},
		&models.Dinner{},
		&models.Film{},
		&models.Penalty{},
		&models.Rating{},
	)
	if err != nil {
		log.Fatal(err)
	}

	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	api := router.Group("/api")
	{
		api.GET("/status", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status": "ok",
			})
		})

		// Dinner API
		api.GET("/dinner", withDatabase(routes.GetAllDinners, database))
		api.GET("/dinner/host/:id", withDatabase(routes.GetAllDinnersForUser, database))
		api.GET("dinner/:id", withDatabase(routes.GetDinnerWithId, database))
		api.POST("/dinner", withDatabase(routes.PostDinner, database))

		// Rating API
		api.GET("/rating", withDatabase(routes.GetAllRatings, database))
		api.GET("/rating/user/:id", withDatabase(routes.GetAllRatingsForUser, database))
		api.GET("/rating/:id", withDatabase(routes.GetRatingWithId, database))
		api.POST("/rating", withDatabase(routes.PostRating, database))

		// Penalty API
		api.GET("/penalty", withDatabase(routes.GetAllPenalties, database))
		api.GET("/penalty/user/:id", withDatabase(routes.GetAllPenaltiesForUser, database))
		api.GET("penalty/:id", withDatabase(routes.GetPenaltyWithId, database))
		api.POST("/penalty", withDatabase(routes.PostPenalty, database))
		// api.DELETE("/transaction/:id", withDatabase(routes.DeleteTransaction, database))

		// User API
		api.GET("/user", withDatabase(routes.GetAllUsers, database))
	}

	err = router.Run(":8080")
	if err != nil {
		log.Fatal(err)
	}
}

func withDatabase(fn func(*gin.Context, *gorm.DB), database *gorm.DB) func(*gin.Context) {
	return func(c *gin.Context) {
		fn(c, database)
	}
}
