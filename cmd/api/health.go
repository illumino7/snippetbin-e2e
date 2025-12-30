package main

import "net/http"

func health(w http.ResponseWriter, r *http.Request) {
	WriteJSON(w, http.StatusOK, map[string]string{"Status": "OK"})
}
