package config

import (
	"os"
	"time"
)

type Config struct {
	ServerAddress   string
	CollectionsPath string
	LogLevel        string
	RequestTimeout  time.Duration
	Version         string
}

func Load() *Config {
	collectionsPath := os.Getenv("COLLECTIONS_PATH")
	if collectionsPath == "" {
		collectionsPath = "../collections"
	}

	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}

	serverAddress := os.Getenv("SERVER_ADDRESS")
	if serverAddress == "" {
		serverAddress = "0.0.0.0:8080"
	}

	return &Config{
		ServerAddress:   serverAddress,
		CollectionsPath: collectionsPath,
		LogLevel:        logLevel,
		RequestTimeout:  30 * time.Second,
		Version:         "0.1.0",
	}
}
