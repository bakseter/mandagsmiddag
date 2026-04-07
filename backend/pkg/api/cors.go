package api

import (
	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/gin-contrib/cors"
)

func configureCORS(conf *config.Config) cors.Config {
	headers := []string{
		"Origin",
		"Content-Type",
		"Accept",
		"Authorization",
		"X-authentik-username",
		"X-authentik-groups",
		"X-authentik-entitlements",
		"X-authentik-email",
		"X-authentik-uid",
	}

	methods := []string{"GET", "PATCH", "PUT", "POST", "DELETE"}

	if conf.Local {
		return cors.Config{
			AllowOrigins: []string{"http://localhost:5173", "http://localhost:3000"},
			AllowMethods: methods,
			AllowHeaders: headers,
		}
	}

	return cors.Config{
		AllowOrigins: []string{conf.Host, "https://authentik.bakseter.net"},
		AllowMethods: methods,
		AllowHeaders: headers,
	}
}
