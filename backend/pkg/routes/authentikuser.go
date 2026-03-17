package routes

import (
	"errors"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// TODO: Rewrite to middleware //nolint:godox

type AuthentikUser struct {
	Username     string
	Groups       []string
	Entitlements []string
	Email        string
	UID          string
}

func getAuthentikUser(ctx *gin.Context) (*AuthentikUser, error) {
	if os.Getenv("LOCAL") == "true" {
		return &AuthentikUser{
			Username:     "Developer",
			Groups:       []string{"group1", "mandagsmiddag-admin", "group2"},
			Entitlements: []string{"entitlement1", "entitlement2"},
			Email:        "dev@example.com",
			UID:          "900347b8a29876b45ca6f75722635ecfedf0e931c6022e3a29a8aa13fb5516fb",
		}, nil
	}

	username := ctx.GetHeader("X-authentik-username")
	if username == "" {
		return nil, errors.New("missing X-authentik-username header")
	}

	groupsHeader := ctx.GetHeader("X-authentik-groups")

	var groups []string

	for value := range strings.SplitSeq(groupsHeader, "|") {
		if value != "" {
			groups = append(groups, value)
		}
	}

	entitlementsHeader := ctx.GetHeader("X-authentik-entitlements")

	var entitlements []string

	for value := range strings.SplitSeq(entitlementsHeader, "|") {
		if value != "" {
			entitlements = append(entitlements, value)
		}
	}

	email := ctx.GetHeader("X-authentik-email")
	if email == "" {
		return nil, errors.New("missing X-authentik-email header")
	}

	uid := ctx.GetHeader("X-authentik-uid")
	if uid == "" {
		return nil, errors.New("missing X-authentik-uid header")
	}

	return &AuthentikUser{
		Username:     username,
		Groups:       groups,
		Entitlements: entitlements,
		Email:        email,
		UID:          uid,
	}, nil
}
