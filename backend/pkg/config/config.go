package config

import (
	"context"
	"errors"
	"os"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/sirupsen/logrus"
)

type Config struct {
	ApplicationMetrics *ApplicationMetrics
	Local              bool
	Host               string
	Port               string
	IDTokenVerifier    *oidc.IDTokenVerifier
	OIDCIssuer         string
	OIDCClientID       string
}

func resolveHost(local bool) (string, error) {
	if local {
		return "http://localhost", nil
	}

	host := os.Getenv("HOST")

	if host == "" {
		return "", errors.New("HostNotSet")
	}

	return host, nil
}

func resolvePort() string {
	port := os.Getenv("PORT")
	if port == "" {
		return "8080"
	}

	return port
}

func configureAuth(ctx context.Context, oidcIssuer string, oidcClientID string) (*oidc.IDTokenVerifier, error) {
	provider, err := oidc.NewProvider(ctx, oidcIssuer)
	if err != nil {
		return nil, errors.New("failed to query provider metadata")
	}

	config := &oidc.Config{
		ClientID: oidcClientID,
	}
	verifier := provider.Verifier(config)

	return verifier, nil
}

func resolveOIDCIssuer(local bool) (string, error) {
	oidcIssuer := os.Getenv("OIDC_ISSUER")
	if oidcIssuer == "" && !local {
		return "", errors.New("OIDCIssuerNotSet")
	}

	return oidcIssuer, nil
}

func resolveOIDCClientID(local bool) (string, error) {
	oidcClientID := os.Getenv("OIDC_CLIENT_ID")
	if oidcClientID == "" && !local {
		return "", errors.New("OIDCClientIDNotSet")
	}

	return oidcClientID, nil
}

func New(ctx context.Context, log *logrus.Logger) (*Config, func(context.Context) error, error) {
	applicationMetrics, shutdownTelemetry, err := ConfigureOpenTelemetry(ctx, log)
	if err != nil {
		return nil, nil, err
	}

	local := os.Getenv("LOCAL") == "true"

	host, err := resolveHost(local)
	if err != nil {
		return nil, nil, err
	}

	port := resolvePort()

	oidcIssuer, err := resolveOIDCIssuer(local)
	if err != nil {
		return nil, nil, err
	}

	oidcClientID, err := resolveOIDCClientID(local)
	if err != nil {
		return nil, nil, err
	}

	idTokenVerifier, err := configureAuth(ctx, oidcIssuer, oidcClientID)
	if err != nil {
		return nil, nil, err
	}

	return &Config{
		ApplicationMetrics: applicationMetrics,
		Local:              local,
		Host:               host,
		Port:               port,
		IDTokenVerifier:    idTokenVerifier,
		OIDCIssuer:         oidcIssuer,
		OIDCClientID:       oidcClientID,
	}, shutdownTelemetry, nil
}
