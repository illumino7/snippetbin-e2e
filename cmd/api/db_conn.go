package main

import (
	"database/sql"
	"fmt"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func OpenSQLDB(dbConfig dbConfig) (*sql.DB, error) {
	db, err := sql.Open("pgx", dbConfig.addr)
	if err != nil {
		return nil, fmt.Errorf("sql.Open: %w", err)
	}

	db.SetMaxOpenConns(dbConfig.maxOpenConns)
	db.SetMaxIdleConns(dbConfig.maxIdleConns)
	db.SetConnMaxIdleTime(dbConfig.maxIdleTime)

	return db, nil
}
