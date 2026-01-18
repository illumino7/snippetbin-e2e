package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid/v5"

	"github.com/illumino7/snippetbin-e2e/internal/db"
)

type snippetCreate struct {
	ID      uuid.UUID `json:"id"`
	Expires string    `json:"expires"`
}

type snippetPrefetch struct {
	ID           uuid.UUID `json:"id"`
	PresignedURL string    `json:"presigned_url"`
}

func GenerateShortCode() (string, error) {
	b := make([]byte, 6)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b)[:8], nil
}

func calculateExpiry(durationCode string) (time.Time, error) {
	now := time.Now().UTC()

	switch durationCode {
	case "10min":
		return now.Add(10 * time.Minute), nil
	case "1h":
		return now.Add(1 * time.Hour), nil
	case "1d":
		return now.AddDate(0, 0, 1), nil
	case "1w":
		return now.AddDate(0, 0, 7), nil
	case "2w":
		return now.AddDate(0, 0, 14), nil
	case "1m":
		return now.AddDate(0, 1, 0), nil
	case "1y":
		return now.AddDate(1, 0, 0), nil
	default:
		return time.Time{}, fmt.Errorf("invalid duration code: %s", durationCode)
	}
}

func (app *application) presignedURL(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.NewV7()
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "failed to generate uuid")
		return
	}
	presignedURL, err := app.s3.Snippet.PutPresignedURL(r.Context(), id.String(), time.Minute*15)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "failed to generate presigned url")
		return
	}
	snippet := snippetPrefetch{
		ID:           id,
		PresignedURL: presignedURL,
	}
	WriteJSON(w, http.StatusOK, snippet)
}

func (app *application) createSnippet(w http.ResponseWriter, r *http.Request) {
	var req snippetCreate
	if err := ReadJSON(w, r, &req); err != nil {
		WriteJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	//verify at s3
	objectName := req.ID.String()
	exists, err := app.s3.Snippet.ObjectExists(r.Context(), objectName)
	if err != nil || !exists {
		app.logger.Error("object not found in s3", "error", err)
		WriteJSONError(w, http.StatusBadRequest, "object not found in s3")
		return
	}

	//expires
	expiresAt, err := calculateExpiry(req.Expires)
	if err != nil {
		app.logger.Error("invalid duration code", "error", err.Error())
		WriteJSONError(w, http.StatusBadRequest, "invalid duration code")
		return
	}

	//short url
	shortCode, err := GenerateShortCode()
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "failed to generate short code")
		return
	}
	snippet := db.Snippet{
		ShortURL:  shortCode,
		ID:        req.ID,
		ExpiresAt: expiresAt,
	}
	if err := app.db.Snippet.Insert(r.Context(), &snippet); err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "failed to insert snippet")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{
		"short_code": snippet.ShortURL,
		"id":         snippet.ID.String(),
	})
}

func (app *application) getSnippet(w http.ResponseWriter, r *http.Request) {
	shortCode := chi.URLParam(r, "short_code")

	cachedSnippet, err := app.cache.Snippet.Get(r.Context(), shortCode)
	if err == nil && cachedSnippet.ID != uuid.Nil {
		app.logger.Info("cache hit")
		objectName := cachedSnippet.ID.String()
		expiry := time.Minute * 15

		presignedURL, err := app.s3.Snippet.GetPresignedURL(r.Context(), objectName, expiry)
		if err != nil {
			app.logger.Error("failed to generate presigned url", "error", err.Error())
			WriteJSONError(w, http.StatusInternalServerError, "failed to generate presigned url")
			return
		}
		WriteJSON(w, http.StatusOK, map[string]string{
			"presigned_url": presignedURL,
		})
		return
	}

	// Cache miss fetch from DB
	if err != nil {
		app.logger.Info("cache miss")
	} else {
		app.logger.Warn("cache returned zero UUID, falling back to DB")
	}

	snippet, err := app.db.Snippet.Get(r.Context(), shortCode)
	if err != nil {
		WriteJSONError(w, http.StatusGone, "snippet not found")
		return
	}

	// write-around strategy
	if err := app.cache.Snippet.Set(r.Context(), snippet); err != nil {
		app.logger.Error("failed to cache snippet", "error", err.Error())
	}

	objectName := snippet.ID.String()
	expiry := time.Minute * 15

	presignedURL, err := app.s3.Snippet.GetPresignedURL(r.Context(), objectName, expiry)
	if err != nil {
		app.logger.Error("failed to generate presigned url", "error", err.Error())
		WriteJSONError(w, http.StatusInternalServerError, "failed to generate presigned url")
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{
		"presigned_url": presignedURL,
	})

}
