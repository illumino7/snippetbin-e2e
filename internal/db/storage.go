package db

import (
	"context"
	"database/sql"
	"time"
)

var QueryTimeOutDuration = 5 * time.Second

type Storage struct {
	Snippet interface {
		Insert(context.Context, *Snippet) error
		Get(context.Context, string) (*Snippet, error)
	}
}

func NewPostgresStore(db *sql.DB) Storage {
	return Storage{
		Snippet: &SnippetModel{db: db},
	}
}
