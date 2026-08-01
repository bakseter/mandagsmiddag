package api

import (
	"net/http"

	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/bakseter/mandagsmiddag/pkg/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func NewRouter(conf *config.Config) (*gin.Engine, error) {
	if !conf.Local {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.ContextWithFallback = true

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
	router.Use(config.LogrusMiddleware(conf.Logger))
	router.Use(config.MetricsMiddleware(conf))

	err := router.SetTrustedProxies(nil)
	if err != nil {
		return nil, err
	}

	addRoutes(conf, router)

	return router, nil
}

func addRoutes(
	conf *config.Config,
	router *gin.Engine,
) {
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := router.Group("/api")
	api.Use(config.AuthMiddleware(conf))
	{
		api.GET("/status", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status": "ok",
			})
		})

		routes.DinnerRoutes(api, conf)
		routes.RatingRoutes(api, conf)
		routes.PenaltyRoutes(api, conf)
		routes.UserRoutes(api, conf)
	}
}
