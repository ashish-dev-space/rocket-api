package handlers

import "github.com/gorilla/mux"

func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/requests/send", SendRequestHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/collections", GetCollectionsHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/collections", CreateCollectionHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/environments", GetEnvironmentsHandler).Methods("GET", "OPTIONS")
}