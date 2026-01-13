package main

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/illumino7/snippetbin-e2e/internal/db"
	"github.com/minio/minio-go/v7"
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

type config struct {
	addr string
	db   dbConfig
	s3   s3Config
}

type application struct {
	logger *slog.Logger
	db     db.Storage
	s3     *minio.Client
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
