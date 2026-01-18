package main

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/illumino7/snippetbin-e2e/internal/cache"
	"github.com/illumino7/snippetbin-e2e/internal/db"
	"github.com/illumino7/snippetbin-e2e/internal/s3"
)

type dbConfig struct {
	addr         string
	maxOpenConns int
	maxIdleConns int
	maxIdleTime  time.Duration
}

type s3Config struct {
	endpoint  string
	accessKey string
	secretKey string
	bucket    string
	useSSL    bool
}

type cacheConfig struct {
	addr string
	port int
}

type config struct {
	addr  string
	db    dbConfig
	s3    s3Config
	cache cacheConfig
}

type application struct {
	logger *slog.Logger
	db     db.Storage
	s3     s3.Storage
	cache  cache.Storage
	cfg    config
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
	r.Route("/api", func(r chi.Router) {
		r.Get("/health", health)
		r.Get("/snippets/presigned", app.presignedURL)
		r.Post("/snippets", app.createSnippet)
		r.Get("/snippets/{short_code}", app.getSnippet)
	})

	return r
}
