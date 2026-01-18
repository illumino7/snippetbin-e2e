package cache

import (
	"context"

	"github.com/illumino7/snippetbin-e2e/internal/db"
	glide "github.com/valkey-io/valkey-glide/go/v2"
)

type Storage struct {
	Snippet interface {
		Set(context.Context, *db.Snippet) error
		Get(context.Context, string) (*db.Snippet, error) // Get by shortCode
	}
}

func NewValkeyStore(cdb *glide.Client) Storage {
	return Storage{
		Snippet: &SnippetCacheModel{cdb: cdb},
	}
}
