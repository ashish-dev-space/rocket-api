# Rocket API

A modern, Bruno-inspired API testing tool with a React frontend and Go backend.

## Features

- 🚀 **Bruno-Compatible**: Uses `.bru` file format for requests
- 📁 **File-Based**: Everything stored as plain text files
- 🔄 **Git-Native**: Perfect for version control
- 🎨 **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- ⚡ **Fast**: Golang backend with Gorilla Mux
- 🌙 **Dark Mode**: Built-in theme support
- 🔒 **Offline-First**: No cloud dependency

## Project Structure

```
rocket-api/
├── frontend/          # React + Vite frontend
├── backend/           # Go backend (DDD architecture)
└── collections/       # Bruno-style API collections
```

## Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- Go 1.21+

### Frontend Setup

```bash
cd frontend
yarn install
yarn dev
```

### Backend Setup

```bash
cd backend
go mod download
go run cmd/server/main.go
```

## Development

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for fast builds
- Tailwind CSS for styling
- React Router for navigation
- Monaco Editor for code editing
- React Query for data fetching
- Zod for validation

### Backend
- Go with Gorilla Mux
- DDD architecture
- Bruno file format support
- RESTful API design

## Collections

Example collections are in `collections/example-api/`:
- Auth endpoints (login)
- User management (CRUD)
- Environment files (dev, prod)

## License

MIT
