package repository

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// HistoryEntry represents a single request/response history entry
type HistoryEntry struct {
	ID          string            `json:"id"`
	Timestamp   time.Time         `json:"timestamp"`
	Method      string            `json:"method"`
	URL         string            `json:"url"`
	Status      int               `json:"status"`
	StatusText  string            `json:"statusText"`
	Duration    int64             `json:"duration"` // milliseconds
	Size        int               `json:"size"`
	Headers     map[string]string `json:"headers"`
	Body        string            `json:"body"`
	RequestBody string            `json:"requestBody"`
}

// HistoryRepository handles file system operations for history
type HistoryRepository struct {
	basePath string
	maxSize  int // maximum number of entries to keep
}

// NewHistoryRepository creates a new history repository
func NewHistoryRepository(basePath string) *HistoryRepository {
	return &HistoryRepository{
		basePath: basePath,
		maxSize:  100, // keep last 100 requests
	}
}

// EnsureBasePath creates the history directory if it doesn't exist
func (r *HistoryRepository) EnsureBasePath() error {
	return os.MkdirAll(r.basePath, 0755)
}

// SaveEntry saves a history entry to disk
func (r *HistoryRepository) SaveEntry(entry *HistoryEntry) error {
	if err := r.EnsureBasePath(); err != nil {
		return err
	}

	// Generate ID if not provided
	if entry.ID == "" {
		entry.ID = fmt.Sprintf("%d", time.Now().UnixNano())
	}

	// Set timestamp if not provided
	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now()
	}

	filePath := filepath.Join(r.basePath, entry.ID+".json")
	data, err := json.MarshalIndent(entry, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal history entry: %w", err)
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write history entry: %w", err)
	}

	// Clean up old entries if exceeding max size
	return r.cleanupOldEntries()
}

// GetEntry retrieves a specific history entry by ID
func (r *HistoryRepository) GetEntry(id string) (*HistoryEntry, error) {
	filePath := filepath.Join(r.basePath, id+".json")
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read history entry: %w", err)
	}

	var entry HistoryEntry
	if err := json.Unmarshal(data, &entry); err != nil {
		return nil, fmt.Errorf("failed to unmarshal history entry: %w", err)
	}

	return &entry, nil
}

// ListEntries returns all history entries sorted by timestamp (newest first)
func (r *HistoryRepository) ListEntries(limit int) ([]*HistoryEntry, error) {
	entries, err := os.ReadDir(r.basePath)
	if err != nil {
		if os.IsNotExist(err) {
			return []*HistoryEntry{}, nil
		}
		return nil, fmt.Errorf("failed to read history directory: %w", err)
	}

	var historyEntries []*HistoryEntry
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}

		id := strings.TrimSuffix(entry.Name(), ".json")
		historyEntry, err := r.GetEntry(id)
		if err != nil {
			continue // skip corrupted entries
		}
		historyEntries = append(historyEntries, historyEntry)
	}

	// Sort by timestamp (newest first)
	sort.Slice(historyEntries, func(i, j int) bool {
		return historyEntries[i].Timestamp.After(historyEntries[j].Timestamp)
	})

	// Apply limit
	if limit > 0 && len(historyEntries) > limit {
		historyEntries = historyEntries[:limit]
	}

	return historyEntries, nil
}

// DeleteEntry deletes a specific history entry
func (r *HistoryRepository) DeleteEntry(id string) error {
	filePath := filepath.Join(r.basePath, id+".json")
	return os.Remove(filePath)
}

// ClearHistory deletes all history entries
func (r *HistoryRepository) ClearHistory() error {
	entries, err := os.ReadDir(r.basePath)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".json") {
			os.Remove(filepath.Join(r.basePath, entry.Name()))
		}
	}

	return nil
}

// cleanupOldEntries removes oldest entries if exceeding max size
func (r *HistoryRepository) cleanupOldEntries() error {
	entries, err := r.ListEntries(0) // get all
	if err != nil {
		return err
	}

	if len(entries) <= r.maxSize {
		return nil
	}

	// Delete oldest entries
	for i := r.maxSize; i < len(entries); i++ {
		r.DeleteEntry(entries[i].ID)
	}

	return nil
}
