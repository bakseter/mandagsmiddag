package config

import (
	"context"
	"errors"
	"os"

	"github.com/sirupsen/logrus"
)

type Config struct {
	ApplicationMetrics *ApplicationMetrics
	Local              bool
	Host               string
	Port               string
	OllamaEndpoint     string
	OllamaModel        string
}

func New(ctx context.Context, log *logrus.Logger) (*Config, func(context.Context) error, error) {
	applicationMetrics, shutdownLogs, err := ConfigureOpenTelemetry(ctx, log)
	if err != nil {
		return nil, nil, err
	}

	local := os.Getenv("LOCAL") == "true"

	host, err := resolveHost(local)
	if err != nil {
		return nil, nil, err
	}

	port := resolvePort()

	ollamaEndpoint, err := resolveOllamaEndpoint(local)
	if err != nil {
		return nil, nil, err
	}

	ollamaModel := resolveOllamaModel()

	return &Config{
		ApplicationMetrics: applicationMetrics,
		Local:              local,
		Host:               host,
		Port:               port,
		OllamaEndpoint:     ollamaEndpoint,
		OllamaModel:        ollamaModel,
	}, shutdownLogs, nil
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

func resolveOllamaEndpoint(local bool) (string, error) {
	if local {
		return "http://ollama:11434", nil
	}

	ollamaEndpoint := ("OLLAMA_ENDPOINT")
	if ollamaEndpoint == "" {
		return "", errors.New("OllamaEndpointNotSet")
	}

	return ollamaEndpoint, nil
}

func resolveOllamaModel() string {
	ollamaModel := os.Getenv("OLLAMA_MODEL")

	if ollamaModel == "" {
		return "gemma3:4b"
	}

	return ollamaModel
}
