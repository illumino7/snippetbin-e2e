package main

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/illumino7/snippetbin-e2e/internal/ratelimiter"
)

func commonHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", "default-src 'self'; style-src 'self' fonts.googleapis.com; font-src fonts.gstatic.com")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "deny")
		w.Header().Set("X-XSS-Protection", "0")
		// w.Header().Set("Server", "Go")
		next.ServeHTTP(w, r)
	})
}

func rateLimitMiddleware(limiter ratelimiter.Limiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract IP from X-Forwarded-For or RemoteAddr
			ip := r.RemoteAddr
			if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
				ip = strings.Split(forwarded, ",")[0]
				ip = strings.TrimSpace(ip)
			}

			allowed, retryAfter, err := limiter.Allow(r.Context(), ip)
			if err != nil {
				WriteJSONError(w, http.StatusInternalServerError, "rate limiter error")
				return
			}
			if !allowed {
				w.Header().Set("Retry-After", fmt.Sprintf("%.0f", retryAfter.Seconds()))
				WriteJSONError(w, http.StatusTooManyRequests, "rate limit exceeded")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
