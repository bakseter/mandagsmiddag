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
	}

	methods := []string{"GET", "PATCH", "PUT", "POST", "DELETE"}

	if conf.Local {
		return cors.Config{
			AllowOrigins: []string{"http://localhost:5173"},
			AllowMethods: methods,
			AllowHeaders: headers,
		}
	}

	return cors.Config{
		AllowOrigins: []string{conf.Host, "https://authentik.bakseter.no"},
		AllowMethods: methods,
		AllowHeaders: headers,
	}
}
