# Web Application Architecture

**Version**: 1.0.0
**Date**: 2026-03-01
**Decision**: Web Application with Local Backend

## Architecture Decision

**Chosen**: Web application with React frontend + Go backend running locally

**Alternatives Considered**:
1. Electron desktop app
2. Tauri desktop app
3. Pure web app (hosted)

**Rationale**:
- Clean separation of concerns (UI vs. business logic)
- Go backend provides excellent performance for file operations
- React ecosystem for modern UI
- Easier to add cloud features in future if needed
- Both processes run locally (no remote server required)

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                    User                          │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│           Browser (http://localhost:5173)          │
│                                                    │
│  ┌──────────────────────────────────────────┐   │
│  │   React Frontend (Vite Dev Server)        │   │
│  │                                            │   │
│  │  • UI Components                          │   │
│  │  • State Management                       │   │
│  │  • Request Builder UI                     │   │
│  │  • Response Viewer UI                     │   │
│  │  • Collection Browser                     │   │
│  └──────────────┬───────────────────────────┘   │
│                  │ HTTP/REST API                  │
│                  │ (localhost:8080)               │
└──────────────────┼────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────┐
│      Go Backend (http://localhost:8080)             │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │   REST API Server (Gorilla Mux)            │   │
│  │                                             │   │
│  │  • Request Execution                       │   │
│  │  • .bru File Parser                        │   │
│  │  • Variable Substitution                   │   │
│  │  • Collection Management                   │   │
│  │  • Environment Management                  │   │
│  │  • File Watcher                            │   │
│  └──────────────┬──────────────────────────────┘  │
│                  │                                  │
│                  │ File System Operations           │
└──────────────────┼──────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────┐
│              Local File System                      │
│                                                     │
│  collections/                                       │
│  ├── my-api/                                       │
│  │   ├── auth/                                     │
│  │   │   └── login.bru                            │
│  │   ├── users/                                    │
│  │   │   ├── get-users.bru                        │
│  │   │   └── create-user.bru                      │
│  │   └── environments/                             │
│  │       ├── dev.env                               │
│  │       └── prod.env                              │
│  └── another-api/                                  │
│      └── ...                                        │
└────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend (React + Vite)

**Technology Stack**:
- React 18 with TypeScript
- Vite for fast development and building
- React Router for navigation
- Tailwind CSS for styling
- React Query for server state management
- Monaco Editor for code editing
- Axios for HTTP client

**Responsibilities**:
- Render UI components
- Handle user interactions
- Manage UI state
- Make API calls to backend
- Display responses
- Theme management

**Development Server**: `http://localhost:5173`
**Production Build**: Static files served by backend

**Project Structure**:
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── RequestBuilder/
│   │   ├── ResponseViewer/
│   │   ├── CollectionTree/
│   │   └── EnvironmentSelector/
│   ├── pages/              # Main views
│   │   ├── RequestPage.tsx
│   │   ├── CollectionsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useRequest.ts
│   │   ├── useCollection.ts
│   │   └── useEnvironment.ts
│   ├── services/           # API client services
│   │   ├── api.ts
│   │   └── collections.ts
│   ├── types/              # TypeScript interfaces
│   │   ├── request.ts
│   │   ├── collection.ts
│   │   └── environment.ts
│   └── utils/              # Utility functions
│       ├── variables.ts
│       └── formatting.ts
├── package.json
└── vite.config.ts
```

### Backend (Go + Gorilla Mux)

**Technology Stack**:
- Go 1.21+
- Gorilla Mux for routing
- Gorilla Handlers for middleware (CORS, logging)
- Viper for configuration
- Logrus for structured logging
- fsnotify for file watching

**Responsibilities**:
- Execute HTTP requests
- Parse and write .bru files
- Variable substitution
- File system operations
- File watching (auto-reload)
- Environment management
- CORS handling for frontend

**API Server**: `http://localhost:8080`

**Project Structure** (DDD):
```
backend/
├── cmd/
│   └── server/
│       └── main.go                  # Application entry point
├── internal/
│   ├── app/                         # Application services
│   │   ├── request_executor.go
│   │   ├── variable_substituter.go
│   │   └── file_watcher.go
│   ├── domain/                      # Domain entities
│   │   ├── collection/
│   │   │   └── collection.go
│   │   ├── request/
│   │   │   └── request.go
│   │   └── environment/
│   │       └── environment.go
│   ├── infrastructure/              # Infrastructure implementations
│   │   ├── repository/
│   │   │   └── collection_repository.go
│   │   ├── storage/
│   │   │   └── bru_storage.go      # .bru file operations
│   │   └── http/
│   │       └── http_client.go      # HTTP request execution
│   └── interfaces/                  # Interface adapters
│       ├── handlers/                # HTTP handlers
│       │   ├── request_handler.go
│       │   ├── collection_handler.go
│       │   └── environment_handler.go
│       └── dto/                     # Data transfer objects
│           ├── request_dto.go
│           └── response_dto.go
├── pkg/                             # Shared packages
│   ├── bru/                        # .bru file format utilities
│   │   ├── parser.go
│   │   └── writer.go
│   └── logger/
│       └── logger.go
├── go.mod
└── go.sum
```

## API Endpoints

### Core API Routes

**Base URL**: `http://localhost:8080/api/v1`

#### Health Check
```
GET /health

Response:
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 12345
}
```

#### Execute Request
```
POST /requests/send

Request Body:
{
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": {
    "Authorization": "Bearer token"
  },
  "body": "",
  "environment": "dev"
}

Response:
{
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json"
  },
  "body": "{\"users\": [...]}",
  "time": 234,
  "size": 1024
}
```

#### Collections
```
GET    /collections              # List all collections
POST   /collections              # Create new collection
GET    /collections/{id}         # Get collection details
PUT    /collections/{id}         # Update collection
DELETE /collections/{id}         # Delete collection
GET    /collections/{id}/files   # List files in collection
```

#### Requests (within collections)
```
GET    /collections/{collectionId}/requests              # List requests
POST   /collections/{collectionId}/requests              # Create request
GET    /collections/{collectionId}/requests/{requestId}  # Get request
PUT    /collections/{collectionId}/requests/{requestId}  # Update request
DELETE /collections/{collectionId}/requests/{requestId}  # Delete request
```

#### Environments
```
GET    /environments              # List all environments
POST   /environments              # Create environment
GET    /environments/{id}         # Get environment
PUT    /environments/{id}         # Update environment
DELETE /environments/{id}         # Delete environment
```

#### File Operations
```
POST   /files/read                # Read .bru file
POST   /files/write               # Write .bru file
POST   /files/watch               # Start watching directory
DELETE /files/watch/{id}          # Stop watching
```

## Communication Flow

### Example: Sending a Request

```
┌─────────┐                  ┌─────────┐                   ┌──────────┐
│ Frontend│                  │ Backend │                   │  Target  │
│ (React) │                  │  (Go)   │                   │   API    │
└────┬────┘                  └────┬────┘                   └─────┬────┘
     │                            │                              │
     │ 1. User clicks "Send"      │                              │
     │                            │                              │
     │ 2. POST /api/v1/requests/send                            │
     │ { method, url, headers... }│                              │
     │──────────────────────────> │                              │
     │                            │                              │
     │                            │ 3. Parse request             │
     │                            │ 4. Substitute {{variables}}  │
     │                            │ 5. Execute HTTP request      │
     │                            │─────────────────────────────>│
     │                            │                              │
     │                            │      6. Response              │
     │                            │<─────────────────────────────│
     │                            │                              │
     │                            │ 7. Process response          │
     │                            │                              │
     │ 8. Response with timing    │                              │
     │<───────────────────────────│                              │
     │                            │                              │
     │ 9. Display in UI           │                              │
     │                            │                              │
```

### Example: Loading a Collection

```
┌─────────┐                  ┌─────────┐                   ┌────────────┐
│ Frontend│                  │ Backend │                   │ File System│
└────┬────┘                  └────┬────┘                   └──────┬─────┘
     │                            │                               │
     │ 1. GET /api/v1/collections │                               │
     │──────────────────────────> │                               │
     │                            │                               │
     │                            │ 2. Read collections/ directory│
     │                            │─────────────────────────────> │
     │                            │                               │
     │                            │ 3. List of .bru files         │
     │                            │<───────────────────────────── │
     │                            │                               │
     │                            │ 4. Parse metadata only        │
     │                            │                               │
     │ 5. Collection list         │                               │
     │<───────────────────────────│                               │
     │                            │                               │
     │ 6. Display in UI           │                               │
     │                            │                               │
```

## Deployment Model

### Development Mode

**Start Backend**:
```bash
cd backend
go run cmd/server/main.go
```

**Start Frontend**:
```bash
cd frontend
yarn dev
```

**Access**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

### Production Mode

**Option 1: Separate Processes**

Build frontend:
```bash
cd frontend
yarn build
# Creates frontend/dist/
```

Build backend:
```bash
cd backend
go build -o rocket-api cmd/server/main.go
```

Start backend (serves frontend):
```bash
./rocket-api
```

**Option 2: Single Binary (Embedded Frontend)**

Embed frontend in Go binary:
```go
//go:embed frontend/dist
var frontendFS embed.FS

func setupStaticFiles(router *mux.Router) {
    // Serve frontend files
    fs := http.FileServer(http.FS(frontendFS))
    router.PathPrefix("/").Handler(fs)
}
```

Build:
```bash
# Build frontend
cd frontend && yarn build && cd ..

# Build backend with embedded frontend
cd backend
go build -o rocket-api cmd/server/main.go
```

Result: Single `rocket-api` binary that includes both frontend and backend.

### Distribution

**Platform-specific Installers**:

**macOS**:
```bash
# Create .app bundle
mkdir -p Rocket-API.app/Contents/MacOS
cp rocket-api Rocket-API.app/Contents/MacOS/
# Add Info.plist, icons, etc.

# Or create DMG
create-dmg Rocket-API.app
```

**Windows**:
```bash
# Create installer with Inno Setup or NSIS
# Package rocket-api.exe with dependencies
```

**Linux**:
```bash
# Create .deb package
# Or AppImage
# Or Snap package
```

## Configuration

### Backend Configuration

**config.yaml**:
```yaml
server:
  host: localhost
  port: 8080
  cors:
    enabled: true
    origins:
      - http://localhost:5173
      - http://localhost:8080

collections:
  rootPath: ./collections
  watchEnabled: true
  watchDebounce: 100ms

performance:
  maxConcurrentRequests: 10
  requestTimeout: 30s
  maxRequestBodySize: 50MB
  maxResponseSize: 100MB

logging:
  level: info
  format: json
  output: stdout
```

**Environment Variables**:
```bash
ROCKET_API_PORT=8080
ROCKET_API_HOST=localhost
ROCKET_API_COLLECTIONS_PATH=./collections
ROCKET_API_LOG_LEVEL=info
```

### Frontend Configuration

**vite.config.ts**:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

## Security Considerations

### CORS Configuration

Backend allows frontend origin:
```go
router.Use(handlers.CORS(
    handlers.AllowedOrigins([]string{
        "http://localhost:5173", // Dev
        "http://localhost:8080", // Prod (served by backend)
    }),
    handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
    handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
))
```

### File System Security

**Path Validation**:
```go
func validatePath(filepath string, baseDir string) error {
    // Resolve to absolute path
    absPath, err := filepath.Abs(filepath)
    if err != nil {
        return err
    }

    // Ensure path is within baseDir (prevent directory traversal)
    if !strings.HasPrefix(absPath, baseDir) {
        return errors.New("path outside allowed directory")
    }

    return nil
}
```

**File Size Limits**:
```go
const (
    MaxBruFileSize = 1 * 1024 * 1024  // 1 MB
    MaxRequestBodySize = 50 * 1024 * 1024  // 50 MB
)

func readBruFile(filepath string) ([]byte, error) {
    stat, err := os.Stat(filepath)
    if err != nil {
        return nil, err
    }

    if stat.Size() > MaxBruFileSize {
        return nil, errors.New("file too large")
    }

    return os.ReadFile(filepath)
}
```

### Request Execution Security

**URL Validation**:
```go
func validateURL(urlStr string) error {
    u, err := url.Parse(urlStr)
    if err != nil {
        return err
    }

    // Block local/private URLs if configured
    if isPrivateIP(u.Hostname()) && !config.AllowPrivateIPs {
        return errors.New("private IPs not allowed")
    }

    return nil
}
```

## Error Handling

### Backend Error Response Format

```go
type ErrorResponse struct {
    Error struct {
        Code    string      `json:"code"`
        Message string      `json:"message"`
        Details interface{} `json:"details,omitempty"`
    } `json:"error"`
}

func sendError(w http.ResponseWriter, code string, message string, status int) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteStatus(status)

    resp := ErrorResponse{
        Error: struct {
            Code    string      `json:"code"`
            Message string      `json:"message"`
            Details interface{} `json:"details,omitempty"`
        }{
            Code:    code,
            Message: message,
        },
    }

    json.NewEncoder(w).Encode(resp)
}
```

### Frontend Error Handling

```typescript
async function sendRequest(request: Request): Promise<Response> {
  try {
    const response = await axios.post('/api/v1/requests/send', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data?.error;

      throw new RocketAPIError({
        code: apiError?.code || 'UNKNOWN',
        userMessage: apiError?.message || 'Request failed',
        technicalMessage: error.message,
        // ... other error fields
      });
    }

    throw error;
  }
}
```

## Performance Optimizations

### Backend

**HTTP Client Pooling**:
```go
var httpClient = &http.Client{
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 10,
        IdleConnTimeout:     90 * time.Second,
    },
    Timeout: 30 * time.Second,
}
```

**Request Caching**:
```go
// Cache parsed .bru files
type BruFileCache struct {
    mu    sync.RWMutex
    cache map[string]*CacheEntry
}

type CacheEntry struct {
    File      *BruFile
    ModTime   time.Time
    ExpiresAt time.Time
}
```

### Frontend

**React Query Caching**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

**Code Splitting**:
```typescript
const ResponseViewer = lazy(() => import('./components/ResponseViewer'));
const MonacoEditor = lazy(() => import('@monaco-editor/react'));
```

## Monitoring & Logging

### Backend Logging

```go
logger := logrus.New()
logger.SetFormatter(&logrus.JSONFormatter{})

logger.WithFields(logrus.Fields{
    "method": req.Method,
    "url":    req.URL.String(),
    "status": resp.StatusCode,
    "time":   resp.Time,
}).Info("Request completed")
```

### Frontend Logging

```typescript
// Development: console
if (import.meta.env.DEV) {
  console.log('[Request]', request);
}

// Production: error tracking service (optional)
if (import.meta.env.PROD) {
  errorTracker.captureException(error);
}
```

## Summary

**Architecture**: Web application with local backend
**Communication**: REST API over localhost
**Deployment**: Single binary (embedded frontend) or separate processes
**Security**: CORS, path validation, file size limits
**Performance**: HTTP client pooling, caching, code splitting

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Modern development experience
- ✅ High performance (Go backend)
- ✅ Flexible deployment options
- ✅ Future-proof (easy to add cloud features if needed)
