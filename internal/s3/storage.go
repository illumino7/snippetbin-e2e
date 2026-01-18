package s3

import (
	"context"
	"time"
)

type Storage struct {
	Snippet interface {
		GetPresignedURL(ctx context.Context, objectID string, expiry time.Duration) (string, error)
		PutPresignedURL(ctx context.Context, objectID string, expiry time.Duration) (string, error)
		ObjectExists(ctx context.Context, objectID string) (bool, error)
	}
}
