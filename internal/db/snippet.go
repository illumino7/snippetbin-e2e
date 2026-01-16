package db

import (
	"context"
	"database/sql"
	"time"

	"github.com/gofrs/uuid/v5"
)

type Snippet struct {
	ShortURL  string
	ID        uuid.UUID
	ExpiresAt time.Time
}

type SnippetModel struct {
	db *sql.DB
}

func (m *SnippetModel) Insert(ctx context.Context, s *Snippet) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeOutDuration)
	defer cancel()
	stmt := `INSERT INTO snippets (short_url, id, expires_at) VALUES ($1, $2, $3)`
	_, err := m.db.ExecContext(ctx, stmt, s.ShortURL, s.ID, s.ExpiresAt)
	if err != nil {
		return err
	}
	return nil
}

func (m *SnippetModel) Get(ctx context.Context, shortURL string) (*Snippet, error) {
	query := `
        SELECT id, expires_at
        FROM snippets
        WHERE short_url = $1 AND expires_at > NOW()`
	var s Snippet
	ctx, cancel := context.WithTimeout(ctx, QueryTimeOutDuration)
	defer cancel()
	err := m.db.QueryRowContext(ctx, query, shortURL).Scan(
		&s.ID,
		&s.ExpiresAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNoRecord
		} else {
			return nil, err
		}
	}
	return &s, nil
}
