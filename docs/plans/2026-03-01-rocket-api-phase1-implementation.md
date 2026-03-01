# Rocket API Phase 1: Foundation (MVP) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working Bruno-inspired API testing tool with request execution, collection management, and environment variables.

**Architecture:** Pure Bruno Philosophy - thin Go backend serving files and proxying HTTP requests, smart React frontend handling all parsing and business logic, plain .bru files on disk (no database).

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui, React Query + Zustand, Monaco Editor, Go 1.21 + Gorilla Mux, DDD architecture, fsnotify for file watching.

---

## Prerequisites Verification

**Step 1: Verify Node.js and Yarn**

```bash
node --version  # Should be 18+
yarn --version  # Should be 1.22+
```

**Step 2: Verify Go**

```bash
go version  # Should be 1.21+
```

**Step 3: Create example collections directory**

```bash
mkdir -p collections/example-api/auth
mkdir -p collections/example-api/users
mkdir -p collections/example-api/environments
```

---

## Task 1: Backend Project Setup

**Files:**
- Create: `backend/go.mod`
- Create: `backend/go.sum`
- Create: `backend/cmd/server/main.go`
- Create: `backend/internal/infrastructure/config/config.go`
- Create: `backend/pkg/logger/logger.go`

**Step 1: Initialize Go module**

```bash
cd backend
go mod init github.com/yourusername/rocket-api
```

**Step 2: Install dependencies**

```bash
go get github.com/gorilla/mux@v1.8.1
go get github.com/gorilla/handlers@v1.5.2
go get github.com/sirupsen/logrus@v1.9.3
go get github.com/fsnotify/fsnotify@v1.7.0
go get github.com/stretchr/testify@v1.8.4
```

**Step 3: Create logger package**

Create `backend/pkg/logger/logger.go`:

```go
package logger

import (
	"github.com/sirupsen/logrus"
	"os"
)

type Logger interface {
	Debug(args ...interface{})
	Debugf(format string, args ...interface{})
	Info(args ...interface{})
	Infof(format string, args ...interface{})
	Warn(args ...interface{})
	Warnf(format string, args ...interface{})
	Error(args ...interface{})
	Errorf(format string, args ...interface{})
	Fatal(args ...interface{})
	Fatalf(format string, args ...interface{})
}

type logrusLogger struct {
	logger *logrus.Logger
}

func New(level string) Logger {
	log := logrus.New()
	log.SetOutput(os.Stdout)
	log.SetFormatter(&logrus.JSONFormatter{})

	lvl, err := logrus.ParseLevel(level)
	if err != nil {
		lvl = logrus.InfoLevel
	}
	log.SetLevel(lvl)

	return &logrusLogger{logger: log}
}

func (l *logrusLogger) Debug(args ...interface{})                 { l.logger.Debug(args...) }
func (l *logrusLogger) Debugf(format string, args ...interface{}) { l.logger.Debugf(format, args...) }
func (l *logrusLogger) Info(args ...interface{})                  { l.logger.Info(args...) }
func (l *logrusLogger) Infof(format string, args ...interface{})  { l.logger.Infof(format, args...) }
func (l *logrusLogger) Warn(args ...interface{})                  { l.logger.Warn(args...) }
func (l *logrusLogger) Warnf(format string, args ...interface{})  { l.logger.Warnf(format, args...) }
func (l *logrusLogger) Error(args ...interface{})                 { l.logger.Error(args...) }
func (l *logrusLogger) Errorf(format string, args ...interface{}) { l.logger.Errorf(format, args...) }
func (l *logrusLogger) Fatal(args ...interface{})                 { l.logger.Fatal(args...) }
func (l *logrusLogger) Fatalf(format string, args ...interface{}) { l.logger.Fatalf(format, args...) }

func NewNoop() Logger {
	log := logrus.New()
	log.SetOutput(os.Stderr)
	log.SetLevel(logrus.PanicLevel)
	return &logrusLogger{logger: log}
}
```

**Step 4: Create config package**

Create `backend/internal/infrastructure/config/config.go`:

```go
package config

import (
	"os"
	"time"
)

type Config struct {
	ServerAddress   string
	CollectionsPath string
	LogLevel        string
	RequestTimeout  time.Duration
	Version         string
}

func Load() *Config {
	collectionsPath := os.Getenv("COLLECTIONS_PATH")
	if collectionsPath == "" {
		collectionsPath = "../collections"
	}

	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}

	serverAddress := os.Getenv("SERVER_ADDRESS")
	if serverAddress == "" {
		serverAddress = "0.0.0.0:8080"
	}

	return &Config{
		ServerAddress:   serverAddress,
		CollectionsPath: collectionsPath,
		LogLevel:        logLevel,
		RequestTimeout:  30 * time.Second,
		Version:         "0.1.0",
	}
}
```

**Step 5: Create minimal main.go**

Create `backend/cmd/server/main.go`:

```go
package main

import (
	"github.com/yourusername/rocket-api/internal/infrastructure/config"
	"github.com/yourusername/rocket-api/pkg/logger"
	"net/http"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg.LogLevel)

	log.Infof("Starting Rocket API v%s", cfg.Version)
	log.Infof("Server address: %s", cfg.ServerAddress)
	log.Infof("Collections path: %s", cfg.CollectionsPath)

	// Placeholder server - will add router later
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	log.Infof("Server listening on %s", cfg.ServerAddress)
	if err := http.ListenAndServe(cfg.ServerAddress, nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
```

**Step 6: Test backend starts**

```bash
cd backend
go run cmd/server/main.go
```

Expected output:
```
{"level":"info","msg":"Starting Rocket API v0.1.0",...}
{"level":"info","msg":"Server listening on 0.0.0.0:8080",...}
```

Test health endpoint:
```bash
curl http://localhost:8080/health
```

Expected: `{"status":"ok"}`

**Step 7: Commit backend setup**

```bash
git add backend/
git commit -m "feat(backend): initialize Go project with config and logger"
```

---

## Task 2: Frontend Project Setup

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`

**Step 1: Initialize Vite React TypeScript project**

```bash
cd frontend
yarn create vite . --template react-ts
```

**Step 2: Install dependencies**

```bash
yarn add react-router-dom@6.20.1
yarn add @tanstack/react-query@5.14.2
yarn add zustand@4.4.7
yarn add axios@1.6.2
yarn add -D tailwindcss@3.3.6 postcss@8.4.32 autoprefixer@10.4.16
yarn add -D @types/node
```

**Step 3: Initialize Tailwind CSS**

```bash
npx tailwindcss init -p
```

Update `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 4: Create global CSS with Tailwind**

Create `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```

**Step 5: Update vite.config.ts for backend proxy**

Update `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

**Step 6: Update tsconfig.json for path aliases**

Update `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 7: Create minimal App.tsx**

Update `frontend/src/App.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Rocket API
          </h1>
          <p className="text-gray-600">
            Bruno-inspired API testing tool
          </p>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
```

**Step 8: Update main.tsx**

Update `frontend/src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 9: Test frontend starts**

```bash
yarn dev
```

Expected: Opens http://localhost:5173 with "Rocket API" heading

**Step 10: Commit frontend setup**

```bash
git add frontend/
git commit -m "feat(frontend): initialize React TypeScript project with Tailwind"
```

---

## Task 3: Domain Models - Collection Entity

**Files:**
- Create: `backend/internal/domain/collection/collection.go`
- Create: `backend/internal/domain/collection/collection_test.go`
- Create: `backend/internal/domain/collection/errors.go`

**Step 1: Write test for Collection creation**

Create `backend/internal/domain/collection/collection_test.go`:

```go
package collection_test

import (
	"testing"

	"github.com/yourusername/rocket-api/internal/domain/collection"
	"github.com/stretchr/testify/assert"
)

func TestNewCollection(t *testing.T) {
	t.Run("creates valid collection", func(t *testing.T) {
		col, err := collection.NewCollection("my-api", "/collections")

		assert.NoError(t, err)
		assert.Equal(t, "my-api", col.Name)
		assert.Equal(t, "/collections/my-api", col.Path)
		assert.NotZero(t, col.CreatedAt)
	})

	t.Run("rejects empty name", func(t *testing.T) {
		_, err := collection.NewCollection("", "/collections")

		assert.Error(t, err)
		assert.Equal(t, collection.ErrInvalidName, err)
	})

	t.Run("rejects name with path traversal", func(t *testing.T) {
		_, err := collection.NewCollection("../invalid", "/collections")

		assert.Error(t, err)
		assert.Equal(t, collection.ErrInvalidName, err)
	})

	t.Run("rejects name with special characters", func(t *testing.T) {
		_, err := collection.NewCollection("my@api", "/collections")

		assert.Error(t, err)
		assert.Equal(t, collection.ErrInvalidName, err)
	})
}

func TestCollectionValidate(t *testing.T) {
	t.Run("validates correct collection", func(t *testing.T) {
		col := &collection.Collection{
			Name: "my-api",
			Path: "/collections/my-api",
		}

		err := col.Validate()
		assert.NoError(t, err)
	})
}
```

**Step 2: Run test to verify it fails**

```bash
cd backend
go test ./internal/domain/collection/... -v
```

Expected: FAIL - package not found

**Step 3: Create errors.go**

Create `backend/internal/domain/collection/errors.go`:

```go
package collection

import "errors"

var (
	ErrInvalidName      = errors.New("invalid collection name")
	ErrCollectionExists = errors.New("collection already exists")
	ErrNotFound         = errors.New("collection not found")
)
```

**Step 4: Implement Collection entity**

Create `backend/internal/domain/collection/collection.go`:

```go
package collection

import (
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

type Collection struct {
	Name      string
	Path      string
	CreatedAt time.Time
}

var validNameRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)

func NewCollection(name string, basePath string) (*Collection, error) {
	if name == "" {
		return nil, ErrInvalidName
	}

	// Check for path traversal
	if strings.Contains(name, "..") || strings.Contains(name, "/") || strings.Contains(name, "\\") {
		return nil, ErrInvalidName
	}

	// Validate name format (alphanumeric, hyphens, underscores only)
	if !validNameRegex.MatchString(name) {
		return nil, ErrInvalidName
	}

	return &Collection{
		Name:      name,
		Path:      filepath.Join(basePath, name),
		CreatedAt: time.Now(),
	}, nil
}

func (c *Collection) Validate() error {
	if c.Name == "" {
		return ErrInvalidName
	}
	if c.Path == "" {
		return ErrInvalidName
	}
	return nil
}
```

**Step 5: Run tests to verify they pass**

```bash
go test ./internal/domain/collection/... -v
```

Expected: PASS - all tests pass

**Step 6: Commit domain models**

```bash
git add backend/internal/domain/
git commit -m "feat(backend): add Collection domain entity with validation"
```

---

## Task 4: Collection Repository Interface

**Files:**
- Create: `backend/internal/domain/collection/repository.go`

**Step 1: Define repository interface**

Create `backend/internal/domain/collection/repository.go`:

```go
package collection

type Folder struct {
	Name       string   `json:"name"`
	Path       string   `json:"path"`
	Requests   []string `json:"requests"`
	Subfolders []Folder `json:"subfolders"`
}

type CollectionStructure struct {
	Name   string   `json:"name"`
	Path   string   `json:"path"`
	Folders []Folder `json:"folders"`
}

type Repository interface {
	// Collection operations
	List() ([]Collection, error)
	Create(collection *Collection) error
	Delete(name string) error
	Exists(name string) (bool, error)
	GetStructure(name string) (*CollectionStructure, error)

	// File operations
	ReadFile(collection, filepath string) ([]byte, error)
	WriteFile(collection, filepath string, content []byte) error
	DeleteFile(collection, filepath string) error

	// Folder operations
	CreateFolder(collection, path string) error
	DeleteFolder(collection, path string) error
}
```

**Step 2: Commit repository interface**

```bash
git add backend/internal/domain/collection/repository.go
git commit -m "feat(backend): add Collection repository interface"
```

---

## Task 5: File-Based Collection Repository Implementation

**Files:**
- Create: `backend/internal/infrastructure/repository/file_collection_repo.go`
- Create: `backend/internal/infrastructure/repository/file_collection_repo_test.go`

**Step 1: Write test for repository List operation**

Create `backend/internal/infrastructure/repository/file_collection_repo_test.go`:

```go
package repository_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/yourusername/rocket-api/internal/domain/collection"
	"github.com/yourusername/rocket-api/internal/infrastructure/repository"
	"github.com/yourusername/rocket-api/pkg/logger"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFileCollectionRepository_List(t *testing.T) {
	tmpDir := t.TempDir()
	repo := repository.NewFileCollectionRepository(tmpDir, logger.NewNoop())

	t.Run("returns empty list when no collections exist", func(t *testing.T) {
		collections, err := repo.List()

		assert.NoError(t, err)
		assert.Empty(t, collections)
	})

	t.Run("returns list of existing collections", func(t *testing.T) {
		// Create test directories
		os.Mkdir(filepath.Join(tmpDir, "api-1"), 0755)
		os.Mkdir(filepath.Join(tmpDir, "api-2"), 0755)

		collections, err := repo.List()

		assert.NoError(t, err)
		assert.Len(t, collections, 2)
	})
}

func TestFileCollectionRepository_Create(t *testing.T) {
	tmpDir := t.TempDir()
	repo := repository.NewFileCollectionRepository(tmpDir, logger.NewNoop())

	t.Run("creates collection directory", func(t *testing.T) {
		col := &collection.Collection{
			Name: "test-api",
			Path: filepath.Join(tmpDir, "test-api"),
		}

		err := repo.Create(col)

		assert.NoError(t, err)
		assert.DirExists(t, col.Path)
	})

	t.Run("returns error if collection already exists", func(t *testing.T) {
		col := &collection.Collection{
			Name: "existing-api",
			Path: filepath.Join(tmpDir, "existing-api"),
		}

		os.Mkdir(col.Path, 0755)

		err := repo.Create(col)

		assert.Error(t, err)
		assert.Equal(t, collection.ErrCollectionExists, err)
	})
}

func TestFileCollectionRepository_Delete(t *testing.T) {
	tmpDir := t.TempDir()
	repo := repository.NewFileCollectionRepository(tmpDir, logger.NewNoop())

	t.Run("deletes existing collection", func(t *testing.T) {
		collectionPath := filepath.Join(tmpDir, "to-delete")
		os.Mkdir(collectionPath, 0755)

		err := repo.Delete("to-delete")

		assert.NoError(t, err)
		assert.NoDirExists(t, collectionPath)
	})

	t.Run("returns error if collection does not exist", func(t *testing.T) {
		err := repo.Delete("nonexistent")

		assert.Error(t, err)
	})
}

func TestFileCollectionRepository_ReadFile(t *testing.T) {
	tmpDir := t.TempDir()
	repo := repository.NewFileCollectionRepository(tmpDir, logger.NewNoop())

	t.Run("reads file content", func(t *testing.T) {
		collectionPath := filepath.Join(tmpDir, "test-api")
		os.Mkdir(collectionPath, 0755)

		testFile := filepath.Join(collectionPath, "test.bru")
		testContent := []byte("test content")
		os.WriteFile(testFile, testContent, 0644)

		content, err := repo.ReadFile("test-api", "test.bru")

		assert.NoError(t, err)
		assert.Equal(t, testContent, content)
	})

	t.Run("returns error if file does not exist", func(t *testing.T) {
		_, err := repo.ReadFile("test-api", "nonexistent.bru")

		assert.Error(t, err)
	})
}

func TestFileCollectionRepository_WriteFile(t *testing.T) {
	tmpDir := t.TempDir()
	repo := repository.NewFileCollectionRepository(tmpDir, logger.NewNoop())

	t.Run("writes file content", func(t *testing.T) {
		collectionPath := filepath.Join(tmpDir, "test-api")
		os.Mkdir(collectionPath, 0755)

		content := []byte("new content")
		err := repo.WriteFile("test-api", "new.bru", content)

		assert.NoError(t, err)

		written, _ := os.ReadFile(filepath.Join(collectionPath, "new.bru"))
		assert.Equal(t, content, written)
	})

	t.Run("creates parent directories if needed", func(t *testing.T) {
		collectionPath := filepath.Join(tmpDir, "test-api-2")
		os.Mkdir(collectionPath, 0755)

		content := []byte("nested content")
		err := repo.WriteFile("test-api-2", "auth/login.bru", content)

		assert.NoError(t, err)
		assert.FileExists(t, filepath.Join(collectionPath, "auth", "login.bru"))
	})
}
```

**Step 2: Run test to verify it fails**

```bash
go test ./internal/infrastructure/repository/... -v
```

Expected: FAIL - package not found

**Step 3: Implement file-based repository**

Create `backend/internal/infrastructure/repository/file_collection_repo.go`:

```go
package repository

import (
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/yourusername/rocket-api/internal/domain/collection"
	"github.com/yourusername/rocket-api/pkg/logger"
)

type FileCollectionRepository struct {
	basePath string
	logger   logger.Logger
}

func NewFileCollectionRepository(basePath string, log logger.Logger) *FileCollectionRepository {
	return &FileCollectionRepository{
		basePath: basePath,
		logger:   log,
	}
}

func (r *FileCollectionRepository) List() ([]collection.Collection, error) {
	entries, err := os.ReadDir(r.basePath)
	if err != nil {
		if os.IsNotExist(err) {
			return []collection.Collection{}, nil
		}
		return nil, err
	}

	var collections []collection.Collection
	for _, entry := range entries {
		if entry.IsDir() && !strings.HasPrefix(entry.Name(), ".") {
			col := collection.Collection{
				Name: entry.Name(),
				Path: filepath.Join(r.basePath, entry.Name()),
			}
			collections = append(collections, col)
		}
	}

	return collections, nil
}

func (r *FileCollectionRepository) Create(col *collection.Collection) error {
	if err := col.Validate(); err != nil {
		return err
	}

	// Check if already exists
	exists, _ := r.Exists(col.Name)
	if exists {
		return collection.ErrCollectionExists
	}

	return os.MkdirAll(col.Path, 0755)
}

func (r *FileCollectionRepository) Delete(name string) error {
	collectionPath := filepath.Join(r.basePath, name)

	if _, err := os.Stat(collectionPath); os.IsNotExist(err) {
		return collection.ErrNotFound
	}

	return os.RemoveAll(collectionPath)
}

func (r *FileCollectionRepository) Exists(name string) (bool, error) {
	collectionPath := filepath.Join(r.basePath, name)
	_, err := os.Stat(collectionPath)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *FileCollectionRepository) GetStructure(name string) (*collection.CollectionStructure, error) {
	exists, err := r.Exists(name)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, collection.ErrNotFound
	}

	structure := &collection.CollectionStructure{
		Name:    name,
		Path:    filepath.Join(r.basePath, name),
		Folders: []collection.Folder{},
	}

	basePath := filepath.Join(r.basePath, name)

	err = filepath.WalkDir(basePath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Skip hidden files and the base path
		if strings.HasPrefix(d.Name(), ".") || path == basePath {
			if d.IsDir() && path != basePath {
				return filepath.SkipDir
			}
			return nil
		}

		// Skip environments directory (handled separately)
		if d.IsDir() && d.Name() == "environments" {
			return filepath.SkipDir
		}

		// Build folder structure
		if d.IsDir() {
			relPath, _ := filepath.Rel(basePath, path)
			folder := collection.Folder{
				Name:       d.Name(),
				Path:       relPath,
				Requests:   []string{},
				Subfolders: []collection.Folder{},
			}

			// Find .bru files in this directory
			entries, _ := os.ReadDir(path)
			for _, entry := range entries {
				if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".bru") {
					folder.Requests = append(folder.Requests, entry.Name())
				}
			}

			structure.Folders = append(structure.Folders, folder)
		}

		return nil
	})

	return structure, err
}

func (r *FileCollectionRepository) ReadFile(collectionName, filepath string) ([]byte, error) {
	fullPath := r.sanitizePath(collectionName, filepath)
	return os.ReadFile(fullPath)
}

func (r *FileCollectionRepository) WriteFile(collectionName, filepath string, content []byte) error {
	fullPath := r.sanitizePath(collectionName, filepath)

	// Ensure parent directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.WriteFile(fullPath, content, 0644)
}

func (r *FileCollectionRepository) DeleteFile(collectionName, filepath string) error {
	fullPath := r.sanitizePath(collectionName, filepath)
	return os.Remove(fullPath)
}

func (r *FileCollectionRepository) CreateFolder(collectionName, path string) error {
	fullPath := r.sanitizePath(collectionName, path)
	return os.MkdirAll(fullPath, 0755)
}

func (r *FileCollectionRepository) DeleteFolder(collectionName, path string) error {
	fullPath := r.sanitizePath(collectionName, path)
	return os.RemoveAll(fullPath)
}

func (r *FileCollectionRepository) sanitizePath(collectionName, filePath string) string {
	return filepath.Join(r.basePath, collectionName, filePath)
}
```

**Step 4: Run tests to verify they pass**

```bash
go test ./internal/infrastructure/repository/... -v
```

Expected: PASS - all tests pass

**Step 5: Commit repository implementation**

```bash
git add backend/internal/infrastructure/repository/
git commit -m "feat(backend): implement file-based collection repository"
```

---

## Task 6: Collection Service (Application Layer)

**Files:**
- Create: `backend/internal/app/collection_service.go`
- Create: `backend/internal/app/collection_service_test.go`

**Step 1: Write test for CollectionService**

Create `backend/internal/app/collection_service_test.go`:

```go
package app_test

import (
	"testing"

	"github.com/yourusername/rocket-api/internal/app"
	"github.com/yourusername/rocket-api/internal/domain/collection"
	"github.com/yourusername/rocket-api/internal/infrastructure/repository"
	"github.com/yourusername/rocket-api/pkg/logger"
	"github.com/stretchr/testify/assert"
)

func TestCollectionService_ListCollections(t *testing.T) {
	tmpDir := t.TempDir()
	repo := repository.NewFileCollectionRepository(tmpDir, logger.NewNoop())
	service := app.NewCollectionService(repo, logger.NewNoop())

	t.Run("returns empty list when no collections", func(t *testing.T) {
		collections, err := service.ListCollections()

		assert.NoError(t, err)
		assert.Empty(t, collections)
	})
}

func TestCollectionService_CreateCollection(t *testing.T) {
	tmpDir := t.TempDir()
	repo := repository.NewFileCollectionRepository(tmpDir, logger.NewNoop())
	service := app.NewCollectionService(repo, logger.NewNoop())

	t.Run("creates new collection", func(t *testing.T) {
		col, err := service.CreateCollection("my-api")

		assert.NoError(t, err)
		assert.Equal(t, "my-api", col.Name)
	})

	t.Run("rejects invalid names", func(t *testing.T) {
		_, err := service.CreateCollection("../invalid")

		assert.Error(t, err)
	})
}

func TestCollectionService_DeleteCollection(t *testing.T) {
	tmpDir := t.TempDir()
	repo := repository.NewFileCollectionRepository(tmpDir, logger.NewNoop())
	service := app.NewCollectionService(repo, logger.NewNoop())

	t.Run("deletes existing collection", func(t *testing.T) {
		service.CreateCollection("to-delete")

		err := service.DeleteCollection("to-delete")

		assert.NoError(t, err)
	})
}
```

**Step 2: Run test to verify it fails**

```bash
go test ./internal/app/... -v
```

Expected: FAIL - package not found

**Step 3: Implement CollectionService**

Create `backend/internal/app/collection_service.go`:

```go
package app

import (
	"github.com/yourusername/rocket-api/internal/domain/collection"
	"github.com/yourusername/rocket-api/pkg/logger"
)

type CollectionService struct {
	repo   collection.Repository
	logger logger.Logger
}

func NewCollectionService(repo collection.Repository, log logger.Logger) *CollectionService {
	return &CollectionService{
		repo:   repo,
		logger: log,
	}
}

func (s *CollectionService) ListCollections() ([]collection.Collection, error) {
	return s.repo.List()
}

func (s *CollectionService) CreateCollection(name string) (*collection.Collection, error) {
	// Create domain entity with validation
	col, err := collection.NewCollection(name, s.repo.(*repository.FileCollectionRepository).GetBasePath())
	if err != nil {
		return nil, err
	}

	// Persist to repository
	if err := s.repo.Create(col); err != nil {
		return nil, err
	}

	s.logger.Infof("Created collection: %s", name)
	return col, nil
}

func (s *CollectionService) DeleteCollection(name string) error {
	if err := s.repo.Delete(name); err != nil {
		return err
	}

	s.logger.Infof("Deleted collection: %s", name)
	return nil
}

func (s *CollectionService) GetStructure(name string) (*collection.CollectionStructure, error) {
	return s.repo.GetStructure(name)
}
```

**Note:** We need to add GetBasePath() method to repository. Update repository:

Add to `backend/internal/infrastructure/repository/file_collection_repo.go`:

```go
func (r *FileCollectionRepository) GetBasePath() string {
	return r.basePath
}
```

**Step 4: Run tests to verify they pass**

```bash
go test ./internal/app/... -v
```

Expected: PASS - all tests pass

**Step 5: Commit service implementation**

```bash
git add backend/internal/app/
git add backend/internal/infrastructure/repository/file_collection_repo.go
git commit -m "feat(backend): add CollectionService application layer"
```

---

## Task 7: HTTP DTOs and Error Responses

**Files:**
- Create: `backend/internal/interfaces/dto/response.go`
- Create: `backend/internal/interfaces/dto/request.go`

**Step 1: Create response DTOs**

Create `backend/internal/interfaces/dto/response.go`:

```go
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

func ToCollectionsResponse(collections []collection.Collection) CollectionsResponse {
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
```

**Step 2: Create request DTOs**

Create `backend/internal/interfaces/dto/request.go`:

```go
package dto

type CreateCollectionRequest struct {
	Name string `json:"name"`
}

type CreateFileRequest struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

type UpdateFileRequest struct {
	Content string `json:"content"`
}

type CreateFolderRequest struct {
	Path string `json:"path"`
}
```

**Step 3: Commit DTOs**

```bash
git add backend/internal/interfaces/dto/
git commit -m "feat(backend): add HTTP DTOs and error response utilities"
```

---

## Task 8: HTTP Handlers - Collection Operations

**Files:**
- Create: `backend/internal/interfaces/http/handlers/collection_handler.go`
- Create: `backend/internal/interfaces/http/handlers/collection_handler_test.go`

**Step 1: Write handler tests**

Create `backend/internal/interfaces/http/handlers/collection_handler_test.go`:

```go
package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/yourusername/rocket-api/internal/app"
	"github.com/yourusername/rocket-api/internal/infrastructure/repository"
	"github.com/yourusername/rocket-api/internal/interfaces/dto"
	"github.com/yourusername/rocket-api/internal/interfaces/http/handlers"
	"github.com/yourusername/rocket-api/pkg/logger"
	"github.com/stretchr/testify/assert"
)

func setupCollectionHandler(t *testing.T) (*handlers.CollectionHandler, string) {
	tmpDir := t.TempDir()
	repo := repository.NewFileCollectionRepository(tmpDir, logger.NewNoop())
	service := app.NewCollectionService(repo, logger.NewNoop())
	handler := handlers.NewCollectionHandler(service, logger.NewNoop())
	return handler, tmpDir
}

func TestCollectionHandler_ListCollections(t *testing.T) {
	handler, _ := setupCollectionHandler(t)

	req := httptest.NewRequest("GET", "/api/v1/collections", nil)
	w := httptest.NewRecorder()

	handler.ListCollections(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response dto.CollectionsResponse
	json.NewDecoder(w.Body).Decode(&response)
	assert.NotNil(t, response.Collections)
}

func TestCollectionHandler_CreateCollection(t *testing.T) {
	handler, _ := setupCollectionHandler(t)

	body := dto.CreateCollectionRequest{Name: "test-api"}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/collections", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handler.CreateCollection(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response dto.CollectionResponse
	json.NewDecoder(w.Body).Decode(&response)
	assert.Equal(t, "test-api", response.Name)
}

func TestCollectionHandler_DeleteCollection(t *testing.T) {
	handler, _ := setupCollectionHandler(t)

	// Create a collection first
	createBody := dto.CreateCollectionRequest{Name: "to-delete"}
	createBodyBytes, _ := json.Marshal(createBody)
	createReq := httptest.NewRequest("POST", "/api/v1/collections", bytes.NewReader(createBodyBytes))
	createReq.Header.Set("Content-Type", "application/json")
	createW := httptest.NewRecorder()
	handler.CreateCollection(createW, createReq)

	// Delete it
	req := httptest.NewRequest("DELETE", "/api/v1/collections/to-delete", nil)
	req = mux.SetURLVars(req, map[string]string{"name": "to-delete"})
	w := httptest.NewRecorder()

	handler.DeleteCollection(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
```

**Step 2: Run test to verify it fails**

```bash
go test ./internal/interfaces/http/handlers/... -v
```

Expected: FAIL - package not found

**Step 3: Implement collection handler**

Create `backend/internal/interfaces/http/handlers/collection_handler.go`:

```go
package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/yourusername/rocket-api/internal/app"
	"github.com/yourusername/rocket-api/internal/domain/collection"
	"github.com/yourusername/rocket-api/internal/interfaces/dto"
	"github.com/yourusername/rocket-api/pkg/logger"
)

type CollectionHandler struct {
	service *app.CollectionService
	logger  logger.Logger
}

func NewCollectionHandler(service *app.CollectionService, log logger.Logger) *CollectionHandler {
	return &CollectionHandler{
		service: service,
		logger:  log,
	}
}

func (h *CollectionHandler) ListCollections(w http.ResponseWriter, r *http.Request) {
	collections, err := h.service.ListCollections()
	if err != nil {
		h.logger.Errorf("Failed to list collections: %v", err)
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list collections")
		return
	}

	response := dto.ToCollectionsResponse(collections)
	dto.WriteJSON(w, http.StatusOK, response)
}

func (h *CollectionHandler) CreateCollection(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateCollectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	col, err := h.service.CreateCollection(req.Name)
	if err != nil {
		if err == collection.ErrInvalidName {
			dto.WriteError(w, http.StatusBadRequest, "INVALID_NAME", "Invalid collection name")
			return
		}
		if err == collection.ErrCollectionExists {
			dto.WriteError(w, http.StatusConflict, "COLLECTION_EXISTS", "Collection already exists")
			return
		}

		h.logger.Errorf("Failed to create collection: %v", err)
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create collection")
		return
	}

	response := dto.ToCollectionResponse(col)
	dto.WriteJSON(w, http.StatusCreated, response)
}

func (h *CollectionHandler) DeleteCollection(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	name := vars["name"]

	if err := h.service.DeleteCollection(name); err != nil {
		if err == collection.ErrNotFound {
			dto.WriteError(w, http.StatusNotFound, "COLLECTION_NOT_FOUND", "Collection not found")
			return
		}

		h.logger.Errorf("Failed to delete collection: %v", err)
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete collection")
		return
	}

	dto.WriteJSON(w, http.StatusOK, dto.SuccessResponse{Success: true})
}

func (h *CollectionHandler) GetStructure(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	name := vars["name"]

	structure, err := h.service.GetStructure(name)
	if err != nil {
		if err == collection.ErrNotFound {
			dto.WriteError(w, http.StatusNotFound, "COLLECTION_NOT_FOUND", "Collection not found")
			return
		}

		h.logger.Errorf("Failed to get collection structure: %v", err)
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get collection structure")
		return
	}

	dto.WriteJSON(w, http.StatusOK, structure)
}
```

**Step 4: Run tests to verify they pass**

```bash
go test ./internal/interfaces/http/handlers/... -v
```

Expected: PASS - all tests pass

**Step 5: Commit handler implementation**

```bash
git add backend/internal/interfaces/http/handlers/
git commit -m "feat(backend): add collection HTTP handlers"
```

---

**(Continuing with remaining tasks...)**

Due to length constraints, I'll provide a summary of the remaining tasks for Phase 1:

## Remaining Tasks Summary

**Task 9:** HTTP Middleware (CORS, Logger, Recovery)
**Task 10:** HTTP Router Setup with Gorilla Mux
**Task 11:** Health Check Handler
**Task 12:** Request Execution (HTTP Proxy) Handler
**Task 13:** File Operations Service and Handler
**Task 14:** Wire Everything in main.go
**Task 15:** Frontend API Client Setup
**Task 16:** Frontend State Management (Zustand + React Query)
**Task 17:** Frontend .bru Parser Implementation
**Task 18:** Frontend Environment Processor
**Task 19:** Frontend Components - Sidebar Structure
**Task 20:** Frontend Components - Request Editor
**Task 21:** Frontend Components - Response Viewer
**Task 22:** Integration Testing
**Task 23:** Documentation and README Updates

---

## Execution Strategy

This plan is comprehensive with ~23 major tasks. Each task follows TDD:
1. Write test
2. Run to see it fail
3. Implement minimal code
4. Run to see it pass
5. Commit

**Estimated Time:** 2-3 days for Phase 1 MVP

**Next Steps:**
1. Execute tasks 1-14 for complete backend
2. Execute tasks 15-21 for complete frontend
3. Integration testing
4. Deploy and test end-to-end

---

Would you like me to continue with the detailed steps for the remaining tasks, or would you prefer to start implementation now?
