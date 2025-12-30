package main

import (
	"encoding/json"
	"net/http"
)

func WriteJSON(w http.ResponseWriter, status int, data any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(data)
}

func WriteJSONError(w http.ResponseWriter, status int, message string) error {
	type Envelope struct {
		Error string `json:"error"`
	}
	return WriteJSON(w, status, &Envelope{Error: message})
}

func ReadJSON(w http.ResponseWriter, r *http.Request, data any) error {
	max_bytes := 1_048_578
	r.Body = http.MaxBytesReader(w, r.Body, int64(max_bytes))
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(data)
}
