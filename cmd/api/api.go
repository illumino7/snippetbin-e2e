package main

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/illumino7/snippetbin-e2e/internal/db"
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
	db     db.Storage
}

func (app *application) routes() http.Handler {
	r := chi.NewRouter()

	//Global middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))
	r.Use(commonHeaders)

	//routes
	r.Get("/health", health)

	return r
}
