package routes

import (
	"errors"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

type AuthentikUser struct {
	Username     string
	Groups       []string
	Entitlements []string
	Email        string
	Name         string
	UID          string
}

func getAuthentikUser(c *gin.Context) (*AuthentikUser, error) {
	if os.Getenv("LOCAL") == "true" {
		return &AuthentikUser{
			Username:     "devuser",
			Groups:       []string{"group1", "mandagsmiddag-admin", "group2"},
			Entitlements: []string{"entitlement1", "entitlement2"},
			Email:        "test@example.com",
			Name:         "Test User",
			UID:          "900347b8a29876b45ca6f75722635ecfedf0e931c6022e3a29a8aa13fb5516fb",
		}, nil
	}

	username := c.GetHeader("X-authentik-username")
	if username == "" {
		return nil, errors.New("missing X-authentik-username header")
	}

	groupsHeader := c.GetHeader("X-authentik-groups")

	var groups []string
	for _, value := range strings.Split(groupsHeader, "|") {
		if value != "" {
			groups = append(groups, value)
		}
	}

	entitlementsHeader := c.GetHeader("X-authentik-entitlements")
	var entitlements []string
	for _, value := range strings.Split(entitlementsHeader, "|") {
		if value != "" {
			entitlements = append(entitlements, value)
		}
	}

	email := c.GetHeader("X-authentik-email")
	if email == "" {
		return nil, errors.New("missing X-authentik-email header")
	}

	name := c.GetHeader("X-authentik-name")
	if name == "" {
		return nil, errors.New("missing X-authentik-name header")
	}

	uid := c.GetHeader("X-authentik-uid")
	if uid == "" {
		return nil, errors.New("missing X-authentik-uid header")
	}

	return &AuthentikUser{
		Username:     username,
		Groups:       groups,
		Entitlements: entitlements,
		Email:        email,
		Name:         name,
		UID:          uid,
	}, nil
}
