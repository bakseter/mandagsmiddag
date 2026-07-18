package config

import (
	"errors"
	"fmt"
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
	if token, err := tokenFromHeader(ctx); err == nil {
		return token, nil
	}

	if token, err := tokenFromCookie(ctx); err == nil {
		return token, nil
	}

	return "", errors.New("no bearer token in Authorization header or session cookie")
}

func tokenFromHeader(ctx *gin.Context) (string, error) {
	authHeader := ctx.GetHeader("Authorization")
	if authHeader == "" {
		return "", errors.New("no authorization header present")
	}

	const prefix = "bearer "

	if len(authHeader) > len(prefix) && strings.EqualFold(authHeader[:len(prefix)], prefix) {
		token := strings.TrimSpace(authHeader[len(prefix):])
		if token == "" {
			return "", errors.New("authorization header has empty bearer token")
		}

		return token, nil
	}

	return "", errors.New("authorization header malformed")
}

func tokenFromCookie(ctx *gin.Context) (string, error) {
	token, err := ctx.Cookie("mandagsmiddag-id-token")
	if err != nil {
		return "", errors.New("no id token cookie present")
	}

	if token == "" {
		return "", errors.New("id token cookie is empty")
	}

	return token, nil
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
		if conf.Local {
			ctx.Set(
				"authentikUser",
				AuthentikUser{
					UID:          "900347b8a29876b45ca6f75722635ecfedf0e931c6022e3a29a8aa13fb5516fb",
					Email:        "dev@example.com",
					Username:     "Developer",
					Groups:       []string{"group1", "mandagsmiddag-admins", "group2"},
					Entitlements: []string{"entitlement1", "entitlement2"},
				},
			)

			ctx.Next()

			return
		}

		bearerToken, err := getBearerToken(ctx)
		if err != nil {
			LoggerFrom(ctx, log).WithError(err).Warn("request rejected: no usable token")
			ctx.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})

			return
		}

		idToken, err := conf.IDTokenVerifier.Verify(ctx.Request.Context(), bearerToken)
		if err != nil {
			LoggerFrom(ctx, log).WithError(err).Warn("token verification failed")
			ctx.AbortWithStatusJSON(401, gin.H{"error": "invalid token"})

			return
		}

		if idToken.Issuer != conf.OIDCIssuer {
			LoggerFrom(ctx, log).
				WithField("expected_issuer", conf.OIDCIssuer).
				WithField("token_issuer", idToken.Issuer).
				Warn("issuer mismatch")
			ctx.AbortWithStatusJSON(401, gin.H{"error": "invalid issuer"})

			return
		}

		var claims struct {
			UID          string   `json:"uid"`
			Email        string   `json:"email"`
			Groups       []string `json:"groups"`
			Entitlements []string `json:"entitlements"`
		}

		if err := idToken.Claims(&claims); err != nil {
			LoggerFrom(ctx, log).WithError(err).Error("failed to parse custom claims")
			ctx.AbortWithStatusJSON(500, gin.H{"error": "failed to parse claims"})

			return
		}

		ctx.Set("authentikUser", AuthentikUser{
			UID:          claims.UID,
			Email:        claims.Email,
			Groups:       claims.Groups,
			Entitlements: claims.Entitlements,
			Username:     idToken.Subject,
		})

		ctx.Next()
	}
}
