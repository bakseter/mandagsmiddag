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
}

func New(ctx context.Context, log *logrus.Logger) (*Config, func(context.Context) error, error) {
	applicationMetrics, shutdownLogs, err := ConfigureOpenTelemetry(ctx, log)
	if err != nil {
		return nil, nil, err
	}

	local := os.Getenv("LOCAL") == "true"
	host, err := func() (string, error) {
		if local {
			return "http://localhost", nil
		}

		host_ := os.Getenv("HOST")

		if host_ == "" {
			return "", errors.New("HostNotSet")
		}

		return host_, nil
	}()
	if err != nil {
		return nil, nil, err
	}

	port := func() string {
		port_ := os.Getenv("PORT")
		if port_ == "" {
			return "8080"
		}

		return port_
	}()

	return &Config{
		ApplicationMetrics: applicationMetrics,
		Local:              local,
		Host:               host,
		Port:               port,
	}, shutdownLogs, nil
}
