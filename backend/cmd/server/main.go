package main

import (
	"net/http"

	"github.com/yourusername/rocket-api/internal/infrastructure/config"
	"github.com/yourusername/rocket-api/pkg/logger"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg.LogLevel)

	log.Infof("Starting Rocket API v%s", cfg.Version)
	log.Infof("Server address: %s", cfg.ServerAddress)
	log.Infof("Collections path: %s", cfg.CollectionsPath)

	// Placeholder server - will add router later
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	log.Infof("Server listening on %s", cfg.ServerAddress)
	if err := http.ListenAndServe(cfg.ServerAddress, nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
