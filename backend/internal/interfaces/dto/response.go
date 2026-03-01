package dto

import (
	"encoding/json"
	"net/http"

	"github.com/yourusername/rocket-api/internal/domain/collection"
)

type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code    string                 `json:"code"`
	Message string                 `json:"message"`
	Details map[string]interface{} `json:"details,omitempty"`
}

func WriteError(w http.ResponseWriter, code int, errorCode, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)

	response := ErrorResponse{
		Error: ErrorDetail{
			Code:    errorCode,
			Message: message,
		},
	}

	json.NewEncoder(w).Encode(response)
}

func WriteJSON(w http.ResponseWriter, code int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(data)
}

type CollectionResponse struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

type CollectionsResponse struct {
	Collections []CollectionResponse `json:"collections"`
}

func ToCollectionResponse(col *collection.Collection) CollectionResponse {
	return CollectionResponse{
		Name: col.Name,
		Path: col.Path,
	}
}

func ToCollectionsResponse(collections []*collection.Collection) CollectionsResponse {
	response := CollectionsResponse{
		Collections: make([]CollectionResponse, 0, len(collections)),
	}

	for _, col := range collections {
		response.Collections = append(response.Collections, CollectionResponse{
			Name: col.Name,
			Path: col.Path,
		})
	}

	return response
}

type FileContentResponse struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

type SuccessResponse struct {
	Success bool `json:"success"`
}
