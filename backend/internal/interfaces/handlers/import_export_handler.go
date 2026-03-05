package handlers

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/yourusername/rocket-api/internal/infrastructure/repository"
	"github.com/yourusername/rocket-api/pkg/bru"
)

// ImportExportHandler handles import/export operations
type ImportExportHandler struct {
	repo *repository.CollectionRepository
}

// NewImportExportHandler creates a new import/export handler
func NewImportExportHandler(repo *repository.CollectionRepository) *ImportExportHandler {
	return &ImportExportHandler{repo: repo}
}

// ImportBruno handles importing a Bruno collection
func (h *ImportExportHandler) ImportBruno(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form
	if err := r.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		http.Error(w, fmt.Sprintf("Failed to parse form: %v", err), http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "No file provided", http.StatusBadRequest)
		return
	}
	defer file.Close()

	collectionName := r.FormValue("name")
	if collectionName == "" {
		collectionName = strings.TrimSuffix(header.Filename, filepath.Ext(header.Filename))
	}

	// Create collection directory
	if err := h.repo.CreateCollection(collectionName); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create collection: %v", err), http.StatusInternalServerError)
		return
	}

	// Handle zip file or directory
	if strings.HasSuffix(header.Filename, ".zip") {
		// Read file content
		content, err := io.ReadAll(file)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to read file: %v", err), http.StatusInternalServerError)
			return
		}
		
		if err := h.importBrunoZip(collectionName, content); err != nil {
			http.Error(w, fmt.Sprintf("Failed to import zip: %v", err), http.StatusInternalServerError)
			return
		}
	} else {
		http.Error(w, "Only zip files are supported for import", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": map[string]interface{}{
			"id":   collectionName,
			"name": collectionName,
		},
		"success": true,
		"message": "Collection imported successfully",
	})
}

func (h *ImportExportHandler) importBrunoZip(collectionName string, zipContent []byte) error {
	reader, err := zip.NewReader(bytes.NewReader(zipContent), int64(len(zipContent)))
	if err != nil {
		return fmt.Errorf("failed to read zip: %w", err)
	}

	var brunoEnvironmentsJSON []byte

	for _, file := range reader.File {
		// Skip directories and non-.bru files
		if file.FileInfo().IsDir() {
			continue
		}

		// Extract file to collection directory
		rc, err := file.Open()
		if err != nil {
			continue
		}

		content, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			continue
		}

		normalizedName := filepath.ToSlash(file.Name)
		if normalizedName == "environments/bruno-collection-environments.json" {
			brunoEnvironmentsJSON = content
		}

		// Save file preserving directory structure
		if err := h.repo.WriteFile(collectionName, file.Name, content); err != nil {
			continue
		}
	}

	if len(brunoEnvironmentsJSON) > 0 {
		importedCount, err := h.importBrunoEnvironmentsJSON(collectionName, brunoEnvironmentsJSON)
		if err != nil {
			return err
		}
		// Remove scaffold environment when actual environments were imported.
		if importedCount > 0 {
			_ = h.repo.DeleteEnvironment(collectionName, "dev")
		}
	}

	return nil
}

func (h *ImportExportHandler) importBrunoEnvironmentsJSON(collectionName string, content []byte) (int, error) {
	var payload struct {
		Environments []struct {
			Name      string `json:"name"`
			Variables []struct {
				Name    string `json:"name"`
				Value   string `json:"value"`
				Enabled *bool  `json:"enabled"`
				Secret  bool   `json:"secret"`
			} `json:"variables"`
		} `json:"environments"`
	}
	if err := json.Unmarshal(content, &payload); err != nil {
		return 0, fmt.Errorf("failed to parse bruno environments json: %w", err)
	}

	importedCount := 0
	for _, env := range payload.Environments {
		if strings.TrimSpace(env.Name) == "" {
			continue
		}

		repoEnv := &repository.Environment{
			Name:      env.Name,
			Variables: make([]repository.EnvVariable, 0, len(env.Variables)),
		}
		for _, v := range env.Variables {
			if strings.TrimSpace(v.Name) == "" {
				continue
			}
			enabled := true
			if v.Enabled != nil {
				enabled = *v.Enabled
			}
			repoEnv.Variables = append(repoEnv.Variables, repository.EnvVariable{
				Key:     v.Name,
				Value:   v.Value,
				Enabled: enabled,
				Secret:  v.Secret,
			})
		}

		if err := h.repo.WriteEnvironment(collectionName, repoEnv); err != nil {
			return importedCount, fmt.Errorf("failed to import environment %q: %w", env.Name, err)
		}
		importedCount++
	}

	return importedCount, nil
}

// ExportBruno handles exporting a collection as Bruno format
func (h *ImportExportHandler) ExportBruno(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	query := r.URL.Query()
	collectionName := query.Get("collection")

	if collectionName == "" {
		http.Error(w, "Collection name is required", http.StatusBadRequest)
		return
	}

	// Create a temporary zip file
	tempFile, err := os.CreateTemp("", "bruno-export-*.zip")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create temp file: %v", err), http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile.Name())

	// Create zip writer
	zipWriter := zip.NewWriter(tempFile)

	// Get all files in collection
	files, err := h.repo.ListFiles(collectionName)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list files: %v", err), http.StatusInternalServerError)
		return
	}

	// Add each file to zip
	for _, filePath := range files {
		content, err := h.repo.ReadFile(collectionName, filePath)
		if err != nil {
			continue
		}

		writer, err := zipWriter.Create(filePath)
		if err != nil {
			continue
		}

		writer.Write(content)
	}

	zipWriter.Close()
	tempFile.Close()

	// Send the zip file
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.zip\"", collectionName))
	http.ServeFile(w, r, tempFile.Name())
}

// ImportPostman handles importing a Postman collection
func (h *ImportExportHandler) ImportPostman(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var postmanCollection struct {
		Info struct {
			Name   string `json:"name"`
			Schema string `json:"schema"`
		} `json:"info"`
		Item []struct {
			Name    string `json:"name"`
			Request struct {
				Method string `json:"method"`
				URL    interface{} `json:"url"`
				Header []struct {
					Key   string `json:"key"`
					Value string `json:"value"`
				} `json:"header"`
				Body struct {
					Mode string `json:"mode"`
					Raw  string `json:"raw"`
				} `json:"body"`
			} `json:"request"`
			Item []interface{} `json:"item"`
		} `json:"item"`
	}

	if err := json.NewDecoder(r.Body).Decode(&postmanCollection); err != nil {
		http.Error(w, fmt.Sprintf("Invalid Postman collection: %v", err), http.StatusBadRequest)
		return
	}

	collectionName := postmanCollection.Info.Name
	if collectionName == "" {
		collectionName = "imported-collection"
	}

	// Create collection
	if err := h.repo.CreateCollection(collectionName); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create collection: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert Postman items to .bru files
	for _, item := range postmanCollection.Item {
		if err := h.convertPostmanItem(collectionName, "", item); err != nil {
			continue
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": map[string]interface{}{
			"id":   collectionName,
			"name": collectionName,
		},
		"success": true,
		"message": "Postman collection imported successfully",
	})
}

func (h *ImportExportHandler) convertPostmanItem(collectionName, folderPath string, item struct {
	Name    string `json:"name"`
	Request struct {
		Method string      `json:"method"`
		URL    interface{} `json:"url"`
		Header []struct {
			Key   string `json:"key"`
			Value string `json:"value"`
		} `json:"header"`
		Body struct {
			Mode string `json:"mode"`
			Raw  string `json:"raw"`
		} `json:"body"`
	} `json:"request"`
	Item []interface{} `json:"item"`
}) error {
	// Skip folders (items with nested items)
	if len(item.Item) > 0 {
		return nil
	}

	// Convert URL to string
	var url string
	switch v := item.Request.URL.(type) {
	case string:
		url = v
	case map[string]interface{}:
		if raw, ok := v["raw"].(string); ok {
			url = raw
		}
	}

	// Convert headers
	var headers []bru.Header
	for _, h := range item.Request.Header {
		headers = append(headers, bru.Header{
			Key:     h.Key,
			Value:   h.Value,
			Enabled: true,
		})
	}

	// Determine body type
	bodyType := "none"
	bodyData := ""
	if item.Request.Body.Mode == "raw" {
		bodyType = "json"
		bodyData = item.Request.Body.Raw
	}

	// Create bru file
	bruFile := &bru.BruFile{
		Meta: struct {
			Name string `json:"name"`
			Type string `json:"type"`
			Seq  int    `json:"seq"`
		}{
			Name: item.Name,
			Type: "http",
			Seq:  1,
		},
		HTTP: struct {
			Method      string           `json:"method"`
			URL         string           `json:"url"`
			Headers     []bru.Header     `json:"headers"`
			QueryParams []bru.QueryParam `json:"queryParams,omitempty"`
			PathParams  []bru.QueryParam `json:"pathParams,omitempty"`
			Body        string           `json:"body,omitempty"`
			Auth        *bru.AuthConfig  `json:"auth,omitempty"`
		}{
			Method:      strings.ToUpper(item.Request.Method),
			URL:         url,
			Headers:     headers,
			QueryParams: []bru.QueryParam{},
			PathParams:  []bru.QueryParam{},
			Body:        bodyData,
			Auth:        nil,
		},
		Body: struct {
			Type string `json:"type"`
			Data string `json:"data,omitempty"`
		}{
			Type: bodyType,
			Data: bodyData,
		},
	}

	filePath := folderPath
	if filePath != "" {
		filePath = filePath + "/"
	}
	filePath = filePath + item.Name + ".bru"

	return h.repo.WriteBruFile(collectionName, filePath, bruFile)
}

// ExportPostman handles exporting a collection as Postman format
func (h *ImportExportHandler) ExportPostman(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	query := r.URL.Query()
	collectionName := query.Get("collection")

	if collectionName == "" {
		http.Error(w, "Collection name is required", http.StatusBadRequest)
		return
	}

	// Get all .bru files
	bruFiles, err := h.repo.ListBruFiles(collectionName)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list files: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert to Postman format
	postmanCollection := map[string]interface{}{
		"info": map[string]interface{}{
			"_postman_id": fmt.Sprintf("rocket-api-%d", time.Now().Unix()),
			"name":        collectionName,
			"schema":      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		},
		"item": []map[string]interface{}{},
	}

	items := []map[string]interface{}{}
	for _, filePath := range bruFiles {
		bruFile, err := h.repo.ParseBruFile(collectionName, filePath)
		if err != nil {
			continue
		}

		// Convert headers
		headers := []map[string]string{}
		for _, h := range bruFile.HTTP.Headers {
			headers = append(headers, map[string]string{
				"key":   h.Key,
				"value": h.Value,
				"type":  "text",
			})
		}

		// Convert body
		body := map[string]interface{}{
			"mode": "raw",
			"raw":  bruFile.HTTP.Body,
		}

		item := map[string]interface{}{
			"name": bruFile.Meta.Name,
			"request": map[string]interface{}{
				"method": bruFile.HTTP.Method,
				"url": map[string]interface{}{
					"raw": bruFile.HTTP.URL,
				},
				"header": headers,
				"body":   body,
			},
			"response": []interface{}{},
		}

		items = append(items, item)
	}

	postmanCollection["item"] = items

	// Send as JSON
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.postman_collection.json\"", collectionName))
	json.NewEncoder(w).Encode(postmanCollection)
}
