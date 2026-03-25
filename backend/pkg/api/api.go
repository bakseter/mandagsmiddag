package api

import (
	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/bakseter/mandagsmiddag/pkg/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func Start(conf *config.Config, log *logrus.Logger) error {
	router := gin.New()

	router.Use(config.LogrusMiddleware(log))
	router.Use(gin.Recovery())
	router.Use(config.MetricsMiddleware(conf))
	router.Use(cors.New(configureCORS(conf)))

	err := router.SetTrustedProxies(nil)
	if err != nil {
		return err
	}

	if !conf.Local {
		gin.SetMode(gin.ReleaseMode)
	}

	database, err := models.ConfigureDatabase(conf)
	if err != nil {
		return err
	}

	addRoutes(router, database)

	err = router.Run(":" + conf.Port)
	if err != nil {
		return err
	}

	return nil
}

func NewRouter(database *gorm.DB) (*gin.Engine, error) {
	router := gin.New()
	router.Use(gin.Recovery())

	if err := router.SetTrustedProxies(nil); err != nil {
		return nil, err
	}

	addRoutes(router, database)

	return router, nil
}

func addRoutes(router *gin.Engine, database *gorm.DB) {
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	api := router.Group("/api")
	{
		api.GET("/status", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status": "ok",
			})
		})

		routes.DinnerRoutes(api, database)
		routes.RatingRoutes(api, database)
		routes.PenaltyRoutes(api, database)
		routes.UserRoutes(api, database)
	}
}
