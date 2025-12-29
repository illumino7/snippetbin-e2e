package main

import (
	"log/slog"
	"time"
)

type dbConfig struct {
	addr         string
	maxOpenConns int
	maxIdleConns int
	maxIdleTime  time.Duration
}

type config struct {
	addr string
	db   dbConfig
}

type application struct {
	logger *slog.Logger
}
