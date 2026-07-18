package config

import (
	"errors"
	"fmt"
	"os"
	"slices"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type AuthentikUser struct {
	UID          string   `json:"uid"`
	Email        string   `json:"email"`
	Username     string   `json:"username"`
	Groups       []string `json:"groups"`
	Entitlements []string `json:"entitlements"`
}

func (user *AuthentikUser) IsAdmin() bool {
	if user == nil {
		return false
	}

	return slices.Contains(
		user.Groups,
		"mandagsmiddag-admins",
	)
}

func getBearerToken(ctx *gin.Context) (string, error) {
	authHeader := ctx.GetHeader("Authorization")
	if authHeader == "" {
		return "", errors.New("no authorization header present")
	}

	if len(authHeader) > 7 && strings.EqualFold(authHeader[:7], "bearer ") {
		return strings.TrimSpace(authHeader[7:]), nil
	}

	return "", errors.New("authorization header malformed")
}

func GetAuthentikUser(ctx *gin.Context) (*AuthentikUser, error) {
	authentikUserRaw, exists := ctx.Get("authentikUser")
	if !exists {
		return nil, errors.New("could not get authentik user from context")
	}

	authentikUser, ok := authentikUserRaw.(AuthentikUser)
	if !ok {
		return nil, fmt.Errorf("could not parse authentik user: %+v", authentikUserRaw)
	}

	return &authentikUser, nil
}

func AuthMiddleware(conf *Config, log *logrus.Logger) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if os.Getenv("LOCAL") == "true" {
			ctx.Set("authentikUser", AuthentikUser{
				UID:          "900347b8a29876b45ca6f75722635ecfedf0e931c6022e3a29a8aa13fb5516fb",
				Email:        "dev@example.com",
				Username:     "Developer",
				Groups:       []string{"group1", "mandagsmiddag-admins", "group2"},
				Entitlements: []string{"entitlement1", "entitlement2"},
			})

			return
		}

		// Not exposed in production
		if ctx.Request.URL.Path == "/healthz" {
			return
		}

		bearerToken, err := getBearerToken(ctx)
		if err != nil {
			log.Error(err)
			ctx.AbortWithStatusJSON(401, gin.H{"error": "no or invalid bearer token:" + err.Error()})

			return
		}

		idToken, err := conf.IDTokenVerifier.Verify(ctx, bearerToken)
		if err != nil {
			log.Error(err)
			ctx.AbortWithStatusJSON(500, gin.H{"error": "failed to verify ID token payload:" + err.Error()})

			return
		}

		// Not sure if we need this one, above function might do this.
		// Leave until we know for sure.
		if idToken.Issuer != conf.OIDCIssuer {
			log.Errorf("issuer not valid: %s != %s", idToken.Issuer, conf.OIDCIssuer)
			ctx.AbortWithStatusJSON(401, gin.H{"error": "issuer not valid"})

			return
		}

		var claims struct {
			UID          string   `json:"uid"`
			Email        string   `json:"email"`
			Groups       []string `json:"groups"`
			Entitlements []string `json:"entitlements"`
		}

		if err := idToken.Claims(&claims); err != nil {
			log.Error(err)
			ctx.AbortWithStatusJSON(500, gin.H{"error": "failed to parse custom claims"})

			return
		}

		authentikUser := AuthentikUser{
			UID:          claims.UID,
			Email:        claims.Email,
			Groups:       claims.Groups,
			Entitlements: claims.Entitlements,
			Username:     idToken.Subject,
		}

		ctx.Set("authentikUser", authentikUser)
	}
}
