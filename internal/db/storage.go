package db

import (
	"context"
	"database/sql"
	"time"

	"github.com/gofrs/uuid/v5"
)

var QueryTimeOutDuration = 5 * time.Second

type Storage struct {
	Snippet interface {
		Insert(context.Context, *Snippet) (uuid.UUID, error)
		Get(context.Context, uuid.UUID) (*Snippet, error)
	}
}

func NewPostgresStore(db *sql.DB) Storage {
	return Storage{
		Snippet: &SnippetModel{db: db},
	}
}
