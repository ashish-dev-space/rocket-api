package handlers

import (
	"archive/zip"
	"bytes"
	"path/filepath"
	"slices"
	"testing"

	"github.com/yourusername/rocket-api/internal/infrastructure/repository"
)

func TestImportBrunoZip_ImportsBrunoEnvironmentJSON(t *testing.T) {
	tempDir := t.TempDir()
	repo := repository.NewCollectionRepository(tempDir)
	handler := NewImportExportHandler(repo)

	const collectionName = "lockstep-inbox"
	if err := repo.CreateCollection(collectionName); err != nil {
		t.Fatalf("CreateCollection() error = %v", err)
	}

	zipBytes := buildTestZip(t, map[string]string{
		"collection.bru": "meta {\n  name: Lockstep Inbox\n}\n",
		"Accounts/Show.bru": "meta {\n  name: Show\n  type: http\n}\nhttp {\n  method: GET\n  url: https://example.com\n}\n",
		"environments/bruno-collection-environments.json": `{
  "info": { "type": "bruno-environment" },
  "environments": [
    {
      "name": "ADO QA EU",
      "variables": [
        { "name": "BASE_URL", "value": "https://qa.example.com", "enabled": true, "secret": false },
        { "name": "API_TOKEN", "value": "abc123", "enabled": true, "secret": true }
      ]
    }
  ]
}`,
	})

	if err := handler.importBrunoZip(collectionName, zipBytes); err != nil {
		t.Fatalf("importBrunoZip() error = %v", err)
	}

	envNames, err := repo.ListEnvironments(collectionName)
	if err != nil {
		t.Fatalf("ListEnvironments() error = %v", err)
	}

	if !slices.Contains(envNames, "ADO QA EU") {
		t.Fatalf("expected imported environment ADO QA EU, got %v", envNames)
	}

	// Import should replace scaffold dev env when Bruno environments are present.
	if slices.Contains(envNames, "dev") {
		t.Fatalf("did not expect default dev environment after import, got %v", envNames)
	}

	env, err := repo.ReadEnvironment(collectionName, "ADO QA EU")
	if err != nil {
		t.Fatalf("ReadEnvironment() error = %v", err)
	}

	var foundBaseURL bool
	var foundSecretToken bool
	for _, v := range env.Variables {
		if v.Key == "BASE_URL" && v.Value == "https://qa.example.com" && !v.Secret {
			foundBaseURL = true
		}
		if v.Key == "API_TOKEN" && v.Value == "abc123" && v.Secret {
			foundSecretToken = true
		}
	}

	if !foundBaseURL || !foundSecretToken {
		t.Fatalf("expected imported env vars with secret flag, got %+v", env.Variables)
	}
}

func buildTestZip(t *testing.T, files map[string]string) []byte {
	t.Helper()

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for name, content := range files {
		w, err := zw.Create(filepath.ToSlash(name))
		if err != nil {
			t.Fatalf("zip create %q: %v", name, err)
		}
		if _, err := w.Write([]byte(content)); err != nil {
			t.Fatalf("zip write %q: %v", name, err)
		}
	}
	if err := zw.Close(); err != nil {
		t.Fatalf("zip close: %v", err)
	}
	return buf.Bytes()
}
