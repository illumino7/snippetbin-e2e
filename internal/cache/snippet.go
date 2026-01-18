package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/gofrs/uuid/v5"
	"github.com/illumino7/snippetbin-e2e/internal/db"
	glide "github.com/valkey-io/valkey-glide/go/v2"
	"github.com/valkey-io/valkey-glide/go/v2/options"
)

type SnippetCacheModel struct {
	cdb *glide.Client
}

func (m *SnippetCacheModel) Set(ctx context.Context, snippet *db.Snippet) error {
	cacheKey := fmt.Sprintf("snippet:%s", snippet.ShortURL)
	ttl := time.Until(snippet.ExpiresAt)

	// Don't cache if already expired
	if ttl <= 0 {
		return nil
	}

	_, err := m.cdb.SetWithOptions(ctx, cacheKey, snippet.ID.String(), options.SetOptions{
		Expiry: options.NewExpiryIn(ttl),
	})
	return err
}

func (m *SnippetCacheModel) Get(ctx context.Context, shortCode string) (*db.Snippet, error) {
	cacheKey := fmt.Sprintf("snippet:%s", shortCode)
	res, err := m.cdb.Get(ctx, cacheKey)
	if err != nil {
		return nil, err
	}
	return &db.Snippet{
		ShortURL: shortCode,
		ID:       uuid.FromStringOrNil(res.Value()),
	}, nil
}
