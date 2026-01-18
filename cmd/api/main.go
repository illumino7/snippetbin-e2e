package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/illumino7/snippetbin-e2e/internal/cache"
	"github.com/illumino7/snippetbin-e2e/internal/db"
	"github.com/illumino7/snippetbin-e2e/internal/env"
	"github.com/illumino7/snippetbin-e2e/internal/s3"
)

func main() {
	cfg := config{
		db: dbConfig{
			addr:         env.GetString("DB_ADDR", ""),
			maxOpenConns: env.GetInt("DB_MAX_OPEN_CONNS", 30),
			maxIdleConns: env.GetInt("DB_MAX_IDLE_CONNS", 30),
			maxIdleTime:  time.Duration(env.GetInt("DB_MAX_IDLE_TIME", 15)),
		},
		s3: s3Config{
			endpoint:  env.GetString("S3_ENDPOINT", ""),
			accessKey: env.GetString("S3_ACCESS_KEY", ""),
			secretKey: env.GetString("S3_SECRET_KEY", ""),
			bucket:    env.GetString("S3_BUCKET", ""),
			useSSL:    env.GetBool("S3_USE_SSL", false),
		},
		cache: cacheConfig{
			addr: env.GetString("CACHE_ADDR", ""),
			port: env.GetInt("CACHE_PORT", 6379),
		},
	}

	//logger
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{AddSource: true}))
	logger.Info("application started")

	//database
	pgdb, err := db.OpenSQLDB(cfg.db.addr, cfg.db.maxOpenConns, cfg.db.maxIdleConns, cfg.db.maxIdleTime)
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
	defer pgdb.Close()
	logger.Info("database connection pool established")
	store := db.NewPostgresStore(pgdb)

	//s3
	s3Client, err := s3.NewS3Conn(cfg.s3.endpoint, cfg.s3.accessKey, cfg.s3.secretKey, cfg.s3.useSSL, cfg.s3.bucket)
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
	logger.Info("s3 connection established")
	s3Store := s3.NewMinioStorage(s3Client, cfg.s3.bucket)

	//valkey
	valkey, err := cache.NewValkeyConn(cfg.cache.addr, cfg.cache.port)
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
	logger.Info("valkey connection established")
	cacheStore := cache.NewValkeyStore(valkey)

	app := application{
		logger: logger,
		db:     store,
		s3:     s3Store,
		cache:  cacheStore,
		cfg:    cfg,
	}

	//testing minio s3 connection
	found, err := s3Client.BucketExists(context.Background(), cfg.s3.bucket)
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
	if !found {
		logger.Error("bucket not found")
		os.Exit(1)
	}
	logger.Info("bucket found")

	//server
	srv := &http.Server{
		Addr:         ":5050",
		Handler:      app.routes(),
		ErrorLog:     slog.NewLogLogger(logger.Handler(), slog.LevelError),
		IdleTimeout:  time.Minute,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	app.logger.Info("server started")
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		app.logger.Error(err.Error())
		os.Exit(1)
	}

}
