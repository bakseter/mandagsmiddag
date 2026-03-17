package main

import (
	"context"

	"github.com/bakseter/mandagsmiddag/pkg/api"
	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/sirupsen/logrus"
)

func main() {
	ctx := context.Background()

	log := logrus.New()
	log.SetFormatter(&logrus.JSONFormatter{})

	conf, shutdownLogs, err := config.New(ctx, log)
	if err != nil {
		log.Errorf("Failed to load config: %v", err)

		return
	}

	defer func() {
		if err := shutdownLogs(ctx); err != nil {
			log.Errorf("failed to shutdown log provider: %v", err)
		}
	}()

	err = api.Start(conf, log)
	if err != nil {
		log.Errorf("Failed to start API: %v", err)
	}
}
