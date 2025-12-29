package db

import (
	"context"
	"database/sql"
	"time"

	"github.com/gofrs/uuid/v5"
)

type Snippet struct {
	ID        uuid.UUID `json:"id"`
	Title     []byte    `json:"title_ciphertext"`
	Content   []byte    `json:"content_ciphertext"`
	IV        []byte    `json:"iv"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

type SnippetModel struct {
	db *sql.DB
}

func (m *SnippetModel) Insert(ctx context.Context, s *Snippet) (uuid.UUID, error) {
	newID, err := uuid.NewV7()
	if err != nil {
		return uuid.Nil, err
	}
	s.ID = newID
	ctx, cancel := context.WithTimeout(ctx, QueryTimeOutDuration)
	defer cancel()
	stmt := `INSERT INTO snippets (id, title, content, iv, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6)`
	err = m.db.QueryRowContext(ctx, stmt, s.ID, s.Title, s.Content, s.IV, s.CreatedAt, s.ExpiresAt).Scan(&s.CreatedAt)
	if err != nil {
		return uuid.Nil, err
	}
	return s.ID, nil
}

func (m *SnippetModel) Get(ctx context.Context, id uuid.UUID) (*Snippet, error) {
	query := `
        SELECT id, title_ciphertext, content_ciphertext, iv, created_at, expires_at
        FROM snippets
        WHERE id = $1 AND expires_at > NOW()`

	var s Snippet
	ctx, cancel := context.WithTimeout(ctx, QueryTimeOutDuration)
	defer cancel()
	err := m.db.QueryRowContext(ctx, query, id).Scan(
		&s.ID,
		&s.Title,
		&s.Content,
		&s.IV,
		&s.CreatedAt,
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
