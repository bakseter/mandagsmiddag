package config

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/sirupsen/logrus"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"gorm.io/gorm"
)

type Config struct {
	ApplicationMetrics *ApplicationMetrics
	Local              bool
	Host               string
	Port               string
	OIDCIssuer         string
	OIDCClientID       string
	HTTPClient         *http.Client
	IDTokenVerifier    *oidc.IDTokenVerifier
	Database           *gorm.DB
	Logger             *logrus.Logger
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

func configureAuth(
	ctx context.Context,
	httpClient *http.Client,
	oidcIssuer string,
	oidcClientID string,
) (*oidc.IDTokenVerifier, error) {
	provider, err := oidc.NewProvider(
		oidc.ClientContext(ctx, httpClient),
		oidcIssuer,
	)
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

func New(ctx context.Context, logger *logrus.Logger) (*Config, func(context.Context) error, error) { //nolint:funlen
	local := os.Getenv("LOCAL") == "true"

	applicationMetrics, shutdownTelemetry, err := ConfigureOpenTelemetry(ctx, logger)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to configure opentelemetry: %w", err)
	}

	fail := func(err error) (*Config, func(context.Context) error, error) { //nolint:contextcheck
		flushCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if shutdownErr := shutdownTelemetry(flushCtx); shutdownErr != nil {
			logger.Errorf("failed to shut down telemetry during startup failure: %s", shutdownErr.Error())
		}

		return nil, nil, err
	}

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

	httpClient := &http.Client{
		Transport: otelhttp.NewTransport(http.DefaultTransport),
		Timeout:   10 * time.Second,
	}

	database, err := configureDatabase(local)
	if err != nil {
		return nil, nil, err
	}

	config := &Config{
		ApplicationMetrics: applicationMetrics,
		Local:              local,
		Host:               host,
		Port:               port,
		IDTokenVerifier:    nil,
		OIDCIssuer:         oidcIssuer,
		OIDCClientID:       oidcClientID,
		HTTPClient:         httpClient,
		Database:           database,
		Logger:             logger,
	}

	if local {
		logger.Warn("LOCAL=true: skipping OIDC setup, auth middleware will inject dummy user")

		return config, shutdownTelemetry, nil
	}

	idTokenVerifier, err := configureAuth(ctx, httpClient, oidcIssuer, oidcClientID)
	if err != nil {
		return fail(err)
	}

	config.IDTokenVerifier = idTokenVerifier

	return config, shutdownTelemetry, nil
}
