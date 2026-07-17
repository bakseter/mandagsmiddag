package config

import (
	"errors"
	"os"
	"slices"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
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

	authentikUser, ok := authentikUserRaw.(*AuthentikUser)
	if !ok {
		return nil, errors.New("could not parse authentik user")
	}

	return authentikUser, nil
}

func AuthMiddleware(conf *Config, log *logrus.Logger) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if os.Getenv("LOCAL") == "true" {
			ctx.Set("authentikUser", &AuthentikUser{
				UID:          "900347b8a29876b45ca6f75722635ecfedf0e931c6022e3a29a8aa13fb5516fb",
				Email:        "dev@example.com",
				Username:     "Developer",
				Groups:       []string{"group1", "mandagsmiddag-admins", "group2"},
				Entitlements: []string{"entitlement1", "entitlement2"},
			})

			return
		}

		bearerToken, err := getBearerToken(ctx)
		if err != nil {
			ctx.AbortWithStatusJSON(401, gin.H{"error": "no or invalid bearer token:" + err.Error()})

			return
		}

		provider, err := oidc.NewProvider(ctx, conf.OIDCIssuer)
		if err != nil {
			ctx.AbortWithStatusJSON(500, gin.H{"error": "failed to query provider metadata:" + err.Error()})

			return
		}

		config := &oidc.Config{
			ClientID: conf.OIDCClientID,
		}
		verifier := provider.Verifier(config)

		idToken, err := verifier.Verify(ctx, bearerToken)
		if err != nil {
			ctx.AbortWithStatusJSON(500, gin.H{"error": "failed to verify ID token payload:" + err.Error()})

			return
		}

		// TODO: remove
		log.Infof("Token Issuer: %s\n", idToken.Issuer)
		log.Infof("User Subject ID: %s\n", idToken.Subject)

		var authentikUser AuthentikUser
		if err := idToken.Claims(&authentikUser); err != nil {
			ctx.AbortWithStatusJSON(500, gin.H{"error": "failed to parse custom claims:" + err.Error()})

			return
		}

		log.Infof("Claims: %+v", authentikUser)

		ctx.Set("authentikUser", authentikUser)
	}
}
