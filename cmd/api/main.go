package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/illumino7/snippetbin-e2e/internal/db"
	"github.com/illumino7/snippetbin-e2e/internal/env"
)

func main() {
	cfg := config{
		db: dbConfig{
			addr:         env.GetString("DB_ADDR", ""),
			maxOpenConns: env.GetInt("DB_MAX_OPEN_CONNS", 30),
			maxIdleConns: env.GetInt("DB_MAX_IDLE_CONNS", 30),
			maxIdleTime:  time.Duration(env.GetInt("DB_MAX_IDLE_TIME", 15)),
		},
	}

	//logger
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{AddSource: true}))
	logger.Info("application started")

	//database
	pgdb, err := OpenSQLDB(cfg.db)
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
	defer pgdb.Close()
	logger.Info("database connection pool established")
	store := db.NewPostgresStore(pgdb)

	app := application{
		logger: logger,
		db:     store,
	}

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
