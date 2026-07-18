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

const (
	idTokenCookieName     = "mandagsmiddag-id-token"
	accessTokenCookieName = "mandagsmiddag-access-token"
)

type tokenSource struct {
	name  string
	value string
}

func looksLikeJWT(token string) bool {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return false
	}

	for _, part := range parts {
		if part == "" {
			return false
		}
	}

	return true
}

func getBearerToken(ctx *gin.Context) (string, string, error) {
	sources := []tokenSource{
		{name: "id_token_cookie", value: cookieValue(ctx, idTokenCookieName)},
		{name: "authorization_header", value: headerToken(ctx)},
		{name: "access_token_cookie", value: cookieValue(ctx, accessTokenCookieName)},
	}

	var rejected []string

	for _, source := range sources {
		if source.value == "" {
			continue
		}

		if !looksLikeJWT(source.value) {
			// Record the shape, never the token itself — these are live
			// credentials and must not reach your logs or Loki.
			rejected = append(rejected, fmt.Sprintf(
				"%s(parts=%d,len=%d)",
				source.name,
				len(strings.Split(source.value, ".")),
				len(source.value),
			))

			continue
		}

		return source.value, source.name, nil
	}

	if len(rejected) > 0 {
		return "", "", fmt.Errorf(
			"found token(s) but none were well-formed JWTs: %s "+
				"(parts=1 means an OPAQUE token — configure Authentik to issue "+
				"JWT access tokens, or rely on the ID token cookie)",
			strings.Join(rejected, ", "),
		)
	}

	return "", "", errors.New("no token in id token cookie, authorization header or access token cookie")
}

func cookieValue(ctx *gin.Context, name string) string {
	value, err := ctx.Cookie(name)
	if err != nil {
		return ""
	}

	return value
}

func headerToken(ctx *gin.Context) string {
	authHeader := ctx.GetHeader("Authorization")
	if authHeader == "" {
		return ""
	}

	const prefix = "bearer "

	if len(authHeader) > len(prefix) && strings.EqualFold(authHeader[:len(prefix)], prefix) {
		return strings.TrimSpace(authHeader[len(prefix):])
	}

	return ""
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

		bearerToken, source, err := getBearerToken(ctx)
		if err != nil {
			LoggerFrom(ctx, log).WithError(err).Warn("no usable token")
			ctx.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})

			return
		}

		idToken, err := conf.IDTokenVerifier.Verify(ctx.Request.Context(), bearerToken)
		if err != nil {
			LoggerFrom(ctx, log).
				WithError(err).
				WithField("token_source", source).
				Warn("token verification failed")
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
