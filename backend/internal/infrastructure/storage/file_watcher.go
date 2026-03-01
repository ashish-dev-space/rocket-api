package storage

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

// FileWatcher watches for file changes in collections directory
type FileWatcher struct {
	watcher     *fsnotify.Watcher
	basePath    string
	handlers    map[string]FileChangeHandler
	mu          sync.RWMutex
	debounceMap map[string]*time.Timer
	debounceMu  sync.Mutex
}

// FileChangeHandler is called when a file changes
type FileChangeHandler func(event FileChangeEvent)

// FileChangeEvent represents a file change event
type FileChangeEvent struct {
	Type         string `json:"type"` // create, write, remove, rename
	Path         string `json:"path"`
	Collection   string `json:"collection"`
	RelativePath string `json:"relativePath"`
}

// NewFileWatcher creates a new file watcher
func NewFileWatcher(basePath string) (*FileWatcher, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, fmt.Errorf("failed to create watcher: %w", err)
	}

	return &FileWatcher{
		watcher:     watcher,
		basePath:    basePath,
		handlers:    make(map[string]FileChangeHandler),
		debounceMap: make(map[string]*time.Timer),
	}, nil
}

// Start begins watching for file changes
func (fw *FileWatcher) Start() error {
	// Watch the base collections directory
	if err := fw.watcher.Add(fw.basePath); err != nil {
		return fmt.Errorf("failed to watch base path: %w", err)
	}

	// Watch existing collection directories
	entries, err := os.ReadDir(fw.basePath)
	if err != nil {
		return fmt.Errorf("failed to read base path: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			collectionPath := filepath.Join(fw.basePath, entry.Name())
			if err := fw.addWatchRecursive(collectionPath); err != nil {
				log.Printf("Warning: failed to watch collection %s: %v", entry.Name(), err)
			}
		}
	}

	// Start the event loop
	go fw.eventLoop()

	return nil
}

// Stop stops the file watcher
func (fw *FileWatcher) Stop() error {
	return fw.watcher.Close()
}

// RegisterHandler registers a handler for a specific collection or "*" for all
func (fw *FileWatcher) RegisterHandler(collection string, handler FileChangeHandler) {
	fw.mu.Lock()
	defer fw.mu.Unlock()
	fw.handlers[collection] = handler
}

// UnregisterHandler removes a handler
func (fw *FileWatcher) UnregisterHandler(collection string) {
	fw.mu.Lock()
	defer fw.mu.Unlock()
	delete(fw.handlers, collection)
}

// WatchCollection starts watching a specific collection
func (fw *FileWatcher) WatchCollection(collectionName string) error {
	collectionPath := filepath.Join(fw.basePath, collectionName)
	return fw.addWatchRecursive(collectionPath)
}

// UnwatchCollection stops watching a specific collection
func (fw *FileWatcher) UnwatchCollection(collectionName string) error {
	collectionPath := filepath.Join(fw.basePath, collectionName)
	return fw.removeWatchRecursive(collectionPath)
}

func (fw *FileWatcher) addWatchRecursive(path string) error {
	return filepath.Walk(path, func(walkPath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			if err := fw.watcher.Add(walkPath); err != nil {
				return err
			}
			log.Printf("Watching: %s", walkPath)
		}
		return nil
	})
}

func (fw *FileWatcher) removeWatchRecursive(path string) error {
	return filepath.Walk(path, func(walkPath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			if err := fw.watcher.Remove(walkPath); err != nil {
				return err
			}
			log.Printf("Stopped watching: %s", walkPath)
		}
		return nil
	})
}

func (fw *FileWatcher) eventLoop() {
	for {
		select {
		case event, ok := <-fw.watcher.Events:
			if !ok {
				return
			}
			fw.handleEvent(event)

		case err, ok := <-fw.watcher.Errors:
			if !ok {
				return
			}
			log.Printf("Watcher error: %v", err)
		}
	}
}

func (fw *FileWatcher) handleEvent(event fsnotify.Event) {
	// Get relative path from base
	relPath, err := filepath.Rel(fw.basePath, event.Name)
	if err != nil {
		return
	}

	// Extract collection name (first part of path)
	parts := strings.Split(relPath, string(filepath.Separator))
	if len(parts) == 0 {
		return
	}

	collection := parts[0]

	// Determine event type
	var eventType string
	switch {
	case event.Op&fsnotify.Create == fsnotify.Create:
		eventType = "create"
		// If a new directory is created, watch it
		if info, err := os.Stat(event.Name); err == nil && info.IsDir() {
			fw.addWatchRecursive(event.Name)
		}
	case event.Op&fsnotify.Write == fsnotify.Write:
		eventType = "write"
	case event.Op&fsnotify.Remove == fsnotify.Remove:
		eventType = "remove"
	case event.Op&fsnotify.Rename == fsnotify.Rename:
		eventType = "rename"
	default:
		return
	}

	// Debounce rapid successive events
	fw.debounce(event.Name, func() {
		changeEvent := FileChangeEvent{
			Type:         eventType,
			Path:         event.Name,
			Collection:   collection,
			RelativePath: relPath,
		}

		fw.notifyHandlers(changeEvent)
	})
}

func (fw *FileWatcher) debounce(key string, fn func()) {
	fw.debounceMu.Lock()
	defer fw.debounceMu.Unlock()

	// Cancel existing timer if any
	if timer, exists := fw.debounceMap[key]; exists {
		timer.Stop()
	}

	// Create new timer
	fw.debounceMap[key] = time.AfterFunc(300*time.Millisecond, func() {
		fw.debounceMu.Lock()
		delete(fw.debounceMap, key)
		fw.debounceMu.Unlock()
		fn()
	})
}

func (fw *FileWatcher) notifyHandlers(event FileChangeEvent) {
	fw.mu.RLock()
	defer fw.mu.RUnlock()

	// Notify collection-specific handler
	if handler, exists := fw.handlers[event.Collection]; exists {
		go handler(event)
	}

	// Notify global handler
	if handler, exists := fw.handlers["*"]; exists {
		go handler(event)
	}
}

// GetWatchedCollections returns a list of currently watched collections
func (fw *FileWatcher) GetWatchedCollections() []string {
	fw.mu.RLock()
	defer fw.mu.RUnlock()

	collections := make([]string, 0, len(fw.handlers))
	for collection := range fw.handlers {
		if collection != "*" {
			collections = append(collections, collection)
		}
	}
	return collections
}