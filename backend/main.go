package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bakseter/mandagsmiddag/pkg/api"
	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/sirupsen/logrus"
)

const (
	shutdownTimeout   = 15 * time.Second
	readHeaderTimeout = 10 * time.Second
)

func main() {
	os.Exit(run())
}

func run() int { //nolint:cyclop,funlen
	log := logrus.New()
	log.SetFormatter(&logrus.JSONFormatter{})

	ctx, stop := signal.NotifyContext(
		context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
	)
	defer stop()

	conf, shutdownTelemetry, err := config.New(ctx, log)
	if err != nil {
		log.Errorf("failed to load config: %v", err)

		return 1
	}

	defer func() {
		flushCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
		defer cancel()

		if err := shutdownTelemetry(flushCtx); err != nil {
			log.Errorf("failed to shut down telemetry providers: %v", err)
		}
	}()

	router, err := api.NewRouter(conf, log)
	if err != nil {
		log.Errorf("failed to build router: %v", err)

		return 1
	}

	server := &http.Server{
		Addr:              ":" + conf.Port,
		Handler:           router,
		ReadHeaderTimeout: readHeaderTimeout,
	}

	serverErr := make(chan error, 1)

	go func() {
		log.WithContext(ctx).Infof("listening on :%s", conf.Port)

		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}

		close(serverErr)
	}()

	select {
	case err, ok := <-serverErr:
		if ok && err != nil {
			log.Errorf("server error: %v", err)

			return 1
		}
	case <-ctx.Done():
		log.WithContext(ctx).Info("shutdown signal received, draining connections")
	}

	drainCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := server.Shutdown(drainCtx); err != nil {
		log.Errorf("graceful shutdown failed: %v", err)

		return 1
	}

	log.Info("shutdown complete")

	return 0
}
