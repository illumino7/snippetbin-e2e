package db

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func OpenSQLDB(addr string, maxOpenConns int, maxIdleConns int, maxIdleTime time.Duration) (*sql.DB, error) {
	db, err := sql.Open("pgx", addr)
	if err != nil {
		return nil, fmt.Errorf("sql.Open: %w", err)
	}

	db.SetMaxOpenConns(maxOpenConns)
	db.SetMaxIdleConns(maxIdleConns)
	db.SetConnMaxIdleTime(maxIdleTime)

	return db, nil
}
