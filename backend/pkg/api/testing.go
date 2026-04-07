//go:build integration

package api

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// NewTestRouter creates a minimal Gin engine for integration tests.
// Only available when built with the integration tag.
func NewTestRouter(database *gorm.DB) (*gin.Engine, error) {
	router := gin.New()
	router.Use(gin.Recovery())

	if err := router.SetTrustedProxies(nil); err != nil {
		return nil, err
	}

	addRoutes(router, database)

	return router, nil
}
