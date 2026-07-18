package api

import (
	"net/http"

	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/bakseter/mandagsmiddag/pkg/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"gorm.io/gorm"
)

func NewRouter(conf *config.Config, log *logrus.Logger) (*gin.Engine, error) {
	if !conf.Local {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	router.Use(
		otelgin.Middleware(
			config.ServiceName,
			otelgin.WithFilter(func(request *http.Request) bool {
				return request.URL.Path != "/metrics"
			}),
		),
	)
	router.Use(gin.Recovery())
	router.Use(cors.New(configureCORS(conf)))
	router.Use(config.LogrusMiddleware(log))
	router.Use(config.MetricsMiddleware(conf))
	router.Use(config.AuthMiddleware(conf, log))

	err := router.SetTrustedProxies(nil)
	if err != nil {
		return nil, err
	}

	database, err := models.ConfigureDatabase(conf)
	if err != nil {
		return nil, err
	}

	addRoutes(router, database)

	return router, nil
}

func addRoutes(router *gin.Engine, database *gorm.DB) {
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

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
