package main

import (
	"log"
	"net/url"
	"os"
	"time"

	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/bakseter/mandagsmiddag/pkg/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func main() {
	dev := func() bool {
		dev_ := os.Getenv("DEV")

		return dev_ == "true"
	}()

	router := gin.Default()
	router.SetTrustedProxies(nil)

	if !dev {
		gin.SetMode(gin.ReleaseMode)
	}

	headers := []string{
    "Origin",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-Auth-Request-User",
    "X-Auth-Request-Email",
    "X-Auth-Requiest-Groups",
    "X-Auth-Request-Access-Token",
    "X-Auth-Request-Preferred-Username",
    "X-Forwarded-Access-Token",
    "X-Forwarded-User",
    "X-Forwarded-Email",
    "X-Forwarded-Preferred-Username",
    "X-Forwarded-Groups",
  }

	  
  if dev {
    // Development CORS - permissive
    router.Use(cors.New(cors.Config{
      AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
      AllowMethods:     []string{"GET", "PUT", "POST", "DELETE"},
      AllowHeaders:     headers,
      ExposeHeaders:    headers,
      AllowCredentials: true,
      MaxAge:           12 * time.Hour,
    }))
  } else {
    // Production CORS - restrictive
    allowOrigins := func() []string {
      host := os.Getenv("HOST")
      if host == "" {
        log.Fatal("HOST environment variable is not set")
      }
      oauth2UserinfoEndpoint := os.Getenv("OAUTH2_USERINFO_ENDPOINT")
      oauth2URL, err := url.Parse(oauth2UserinfoEndpoint)
      if oauth2UserinfoEndpoint == "" || err != nil {
        log.Printf(
          "failed to parse OAUTH2_USERINFO_ENDPOINT, not adding it to AllowOrigins: %v",
          err,
        )
        return []string{host}
      }
      return []string{host, oauth2URL.Scheme + "://" + oauth2URL.Host}
    }()
    
    router.Use(cors.New(cors.Config{
      AllowOrigins:     allowOrigins,
      AllowMethods:     []string{"GET", "PUT", "POST", "DELETE"},
      AllowHeaders:     headers,
      ExposeHeaders:    headers,
      AllowCredentials: true,
      MaxAge:           12 * time.Hour,
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
