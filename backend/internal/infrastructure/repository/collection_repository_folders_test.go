package repository

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func setupCollectionRepo(t *testing.T) *CollectionRepository {
	t.Helper()
	base := t.TempDir()
	repo := NewCollectionRepository(base)
	if err := repo.EnsureBasePath(); err != nil {
		t.Fatalf("failed to ensure base path: %v", err)
	}
	if err := repo.CreateCollection("test"); err != nil {
		t.Fatalf("failed to create collection: %v", err)
	}
	return repo
}

func TestCreateFolder(t *testing.T) {
	repo := setupCollectionRepo(t)

	path, err := repo.CreateFolder("test", "", "users")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if path != "users" {
		t.Fatalf("expected path users, got %s", path)
	}

	nested, err := repo.CreateFolder("test", "users", "v1")
	if err != nil {
		t.Fatalf("expected no error for nested folder, got %v", err)
	}
	if nested != "users/v1" {
		t.Fatalf("expected path users/v1, got %s", nested)
	}

	if _, err := os.Stat(filepath.Join(repo.basePath, "test", "users", "v1")); err != nil {
		t.Fatalf("expected nested folder to exist: %v", err)
	}
}

func TestCreateFolderRejectsDuplicateAndTraversal(t *testing.T) {
	repo := setupCollectionRepo(t)
	if _, err := repo.CreateFolder("test", "", "users"); err != nil {
		t.Fatalf("expected initial create to pass: %v", err)
	}
	if _, err := repo.CreateFolder("test", "", "users"); err == nil {
		t.Fatalf("expected duplicate folder error")
	}

	if _, err := repo.CreateFolder("test", "../bad", "oops"); err == nil {
		t.Fatalf("expected traversal path to fail")
	}
}

func TestCreateRequest(t *testing.T) {
	repo := setupCollectionRepo(t)
	if _, err := repo.CreateFolder("test", "", "users"); err != nil {
		t.Fatalf("failed to create folder: %v", err)
	}

	path, err := repo.CreateRequest("test", "users", "list-users", "GET")
	if err != nil {
		t.Fatalf("expected request create success, got %v", err)
	}
	if path != "users/list-users.bru" {
		t.Fatalf("expected users/list-users.bru, got %s", path)
	}

	if _, err := repo.CreateRequest("test", "users", "list-users", "GET"); err == nil {
		t.Fatalf("expected duplicate request error")
	}
}

func TestGetCollectionStructure_IgnoresBrunoFolderMetadataFiles(t *testing.T) {
	repo := setupCollectionRepo(t)

	if err := repo.WriteFile("test", "Accounts/folder.bru", []byte("meta {\n  name: Accounts\n  seq: 1\n}\n")); err != nil {
		t.Fatalf("failed to write folder.bru: %v", err)
	}
	if err := repo.WriteFile("test", "Accounts/Users/folder.bru", []byte("meta {\n  name: Users\n  seq: 1\n}\n")); err != nil {
		t.Fatalf("failed to write nested folder.bru: %v", err)
	}
	if err := repo.WriteFile("test", "Accounts/Users/Index.bru", []byte(strings.Join([]string{
		"meta {",
		"  name: Index",
		"  type: http",
		"}",
		"",
		"get {",
		"  url: https://example.com/users",
		"  body: none",
		"}",
		"",
	}, "\n"))); err != nil {
		t.Fatalf("failed to write request .bru: %v", err)
	}

	tree, err := repo.GetCollectionStructure("test")
	if err != nil {
		t.Fatalf("GetCollectionStructure() error = %v", err)
	}

	var requestPaths []string
	var walk func(nodes []CollectionNode)
	walk = func(nodes []CollectionNode) {
		for _, n := range nodes {
			if n.Type == "request" {
				requestPaths = append(requestPaths, n.Path)
			}
			if len(n.Children) > 0 {
				walk(n.Children)
			}
		}
	}
	walk(tree.Children)

	for _, p := range requestPaths {
		if strings.HasSuffix(p, "/folder.bru") || p == "folder.bru" {
			t.Fatalf("folder metadata must not appear as request, got request path %q in %+v", p, requestPaths)
		}
	}

	hasIndex := false
	for _, p := range requestPaths {
		if p == "Accounts/Users/Index.bru" {
			hasIndex = true
			break
		}
	}
	if !hasIndex {
		t.Fatalf("expected real request in tree, got %v", requestPaths)
	}
}
