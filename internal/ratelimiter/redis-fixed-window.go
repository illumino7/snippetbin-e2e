package ratelimiter

import (
	"context"
	"fmt"
	"time"

	glide "github.com/valkey-io/valkey-glide/go/v2"
)

type FixedWindowRateLimiter struct {
	client *glide.Client
	limit  int
	window time.Duration
}

func NewFixedWindowRateLimiter(client *glide.Client, limit int, window time.Duration) *FixedWindowRateLimiter {
	return &FixedWindowRateLimiter{
		client: client,
		limit:  limit,
		window: window,
	}
}

func (r *FixedWindowRateLimiter) Allow(ctx context.Context, ip string) (bool, time.Duration, error) {
	key := fmt.Sprintf("ratelimit:%s", ip)

	count, err := r.client.Incr(ctx, key)
	if err != nil {
		return false, 0, err
	}

	// Set expiry on first request in the window
	if count == 1 {
		r.client.Expire(ctx, key, r.window)
	}

	if int(count) > r.limit {
		ttl, err := r.client.TTL(ctx, key)
		if err != nil {
			return false, 0, err
		}
		return false, time.Duration(ttl) * time.Second, nil
	}

	return true, 0, nil
}
