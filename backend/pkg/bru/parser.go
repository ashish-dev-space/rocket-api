package bru

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
)

// Header represents an HTTP header key-value pair
type Header struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// QueryParam represents a URL query parameter
type QueryParam struct {
	Key     string `json:"key"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

// AuthConfig represents authentication configuration
type AuthConfig struct {
	Type   string `json:"type"` // "none", "basic", "bearer", "api-key"
	Basic  *struct {
		Username string `json:"username"`
		Password string `json:"password"`
	} `json:"basic,omitempty"`
	Bearer *struct {
		Token string `json:"token"`
	} `json:"bearer,omitempty"`
	APIKey *struct {
		Key   string `json:"key"`
		Value string `json:"value"`
		In    string `json:"in"` // "header" or "query"
	} `json:"apiKey,omitempty"`
}

// BruFile represents the structure of a .bru file
type BruFile struct {
	Meta struct {
		Name string `json:"name"`
		Type string `json:"type"`
		Seq  int    `json:"seq"`
	} `json:"meta"`
	HTTP struct {
		Method      string       `json:"method"`
		URL         string       `json:"url"`
		Headers     []Header     `json:"headers"`
		QueryParams []QueryParam `json:"queryParams,omitempty"`
		Body        string       `json:"body,omitempty"`
		Auth        *AuthConfig  `json:"auth,omitempty"`
	} `json:"http"`
	Body struct {
		Type string `json:"type"`
		Data string `json:"data,omitempty"`
	} `json:"body"`
	Vars       map[string]interface{} `json:"vars,omitempty"`
	Assertions []string               `json:"assertions,omitempty"`
}

// Parse reads and parses a .bru file
func Parse(filepath string) (*BruFile, error) {
	content, err := os.ReadFile(filepath)
	if err != nil {
		return nil, fmt.Errorf("failed to read .bru file: %w", err)
	}

	return ParseContent(string(content))
}

// ParseContent parses .bru file content from string
func ParseContent(content string) (*BruFile, error) {
	bru := &BruFile{
		HTTP: struct {
			Method      string       `json:"method"`
			URL         string       `json:"url"`
			Headers     []Header     `json:"headers"`
			QueryParams []QueryParam `json:"queryParams,omitempty"`
			Body        string       `json:"body,omitempty"`
			Auth        *AuthConfig  `json:"auth,omitempty"`
		}{
			Headers:     []Header{},
			QueryParams: []QueryParam{},
		},
		Vars:       make(map[string]interface{}),
		Assertions: []string{},
	}

	scanner := bufio.NewScanner(strings.NewReader(content))
	var currentSection string
	var bodyContent strings.Builder
	inBody := false

	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)

		// Skip empty lines and comments
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		// Detect section headers
		if strings.HasSuffix(trimmed, ":") && !strings.Contains(trimmed, "http:") {
			currentSection = strings.TrimSuffix(trimmed, ":")
			inBody = false
			continue
		}

		// Parse meta section
		if currentSection == "meta" {
			parseMetaLine(trimmed, bru)
		}

		// Parse http section
		if currentSection == "http" {
			if strings.HasPrefix(trimmed, "method:") {
				bru.HTTP.Method = strings.TrimSpace(strings.TrimPrefix(trimmed, "method:"))
			} else if strings.HasPrefix(trimmed, "url:") {
				bru.HTTP.URL = strings.TrimSpace(strings.TrimPrefix(trimmed, "url:"))
			} else if strings.HasPrefix(trimmed, "headers:") {
				// Headers will be parsed in subsequent lines
			} else if strings.HasPrefix(trimmed, "-") && bru.HTTP.Headers != nil {
				// Parse header line
				headerLine := strings.TrimPrefix(trimmed, "-")
				headerLine = strings.TrimSpace(headerLine)
				parts := strings.SplitN(headerLine, ":", 2)
				if len(parts) == 2 {
					bru.HTTP.Headers = append(bru.HTTP.Headers, Header{
						Key:   strings.TrimSpace(parts[0]),
						Value: strings.TrimSpace(parts[1]),
					})
				}
			}
		}

		// Parse body section
		if currentSection == "body" {
			if strings.HasPrefix(trimmed, "type:") {
				bru.Body.Type = strings.TrimSpace(strings.TrimPrefix(trimmed, "type:"))
			} else if strings.HasPrefix(trimmed, "data:") {
				inBody = true
				bodyContent.Reset()
				// Check if there's inline content
				inlineData := strings.TrimSpace(strings.TrimPrefix(trimmed, "data:"))
				if inlineData != "" && inlineData != "|" {
					bodyContent.WriteString(inlineData)
				}
			} else if inBody && strings.HasPrefix(line, "  ") {
				// Indented body content
				bodyContent.WriteString(strings.TrimPrefix(line, "  "))
				bodyContent.WriteString("\n")
			}
		}

		// Parse vars section
		if currentSection == "vars" {
			if strings.Contains(trimmed, ":") {
				parts := strings.SplitN(trimmed, ":", 2)
				key := strings.TrimSpace(parts[0])
				value := strings.TrimSpace(parts[1])
				// Try to parse as int or bool, otherwise string
				if intVal, err := strconv.Atoi(value); err == nil {
					bru.Vars[key] = intVal
				} else if value == "true" {
					bru.Vars[key] = true
				} else if value == "false" {
					bru.Vars[key] = false
				} else {
					bru.Vars[key] = strings.Trim(value, `"`)
				}
			}
		}

		// Parse assertions section
		if currentSection == "assertions" {
			if strings.HasPrefix(trimmed, "-") {
				assertion := strings.TrimSpace(strings.TrimPrefix(trimmed, "-"))
				bru.Assertions = append(bru.Assertions, assertion)
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading content: %w", err)
	}

	// Set body content
	bru.HTTP.Body = strings.TrimSpace(bodyContent.String())
	if bru.Body.Type == "" {
		bru.Body.Type = "none"
	}

	return bru, nil
}

func parseMetaLine(line string, bru *BruFile) {
	if strings.HasPrefix(line, "name:") {
		bru.Meta.Name = strings.TrimSpace(strings.TrimPrefix(line, "name:"))
		bru.Meta.Name = strings.Trim(bru.Meta.Name, `"`)
	} else if strings.HasPrefix(line, "type:") {
		bru.Meta.Type = strings.TrimSpace(strings.TrimPrefix(line, "type:"))
	} else if strings.HasPrefix(line, "seq:") {
		seqStr := strings.TrimSpace(strings.TrimPrefix(line, "seq:"))
		if seq, err := strconv.Atoi(seqStr); err == nil {
			bru.Meta.Seq = seq
		}
	}
}

// Write writes a BruFile to disk
func Write(filepath string, bru *BruFile) error {
	content := GenerateContent(bru)
	return os.WriteFile(filepath, []byte(content), 0644)
}

// GenerateContent generates .bru file content from BruFile
func GenerateContent(bru *BruFile) string {
	var content strings.Builder

	// Meta section
	content.WriteString("meta {\n")
	content.WriteString(fmt.Sprintf("  name: %s\n", bru.Meta.Name))
	content.WriteString(fmt.Sprintf("  type: %s\n", bru.Meta.Type))
	if bru.Meta.Seq > 0 {
		content.WriteString(fmt.Sprintf("  seq: %d\n", bru.Meta.Seq))
	}
	content.WriteString("}\n\n")

	// HTTP section
	content.WriteString("http {\n")
	content.WriteString(fmt.Sprintf("  method: %s\n", bru.HTTP.Method))
	content.WriteString(fmt.Sprintf("  url: %s\n", bru.HTTP.URL))

	// Query Params
	if len(bru.HTTP.QueryParams) > 0 {
		content.WriteString("  query {\n")
		for _, q := range bru.HTTP.QueryParams {
			if q.Enabled {
				content.WriteString(fmt.Sprintf("    %s: %s\n", q.Key, q.Value))
			}
		}
		content.WriteString("  }\n")
	}

	// Headers
	if len(bru.HTTP.Headers) > 0 {
		content.WriteString("  headers {\n")
		for _, h := range bru.HTTP.Headers {
			content.WriteString(fmt.Sprintf("    %s: %s\n", h.Key, h.Value))
		}
		content.WriteString("  }\n")
	}

	// Auth
	if bru.HTTP.Auth != nil && bru.HTTP.Auth.Type != "none" {
		content.WriteString("  auth {\n")
		content.WriteString(fmt.Sprintf("    type: %s\n", bru.HTTP.Auth.Type))
		
		switch bru.HTTP.Auth.Type {
		case "basic":
			if bru.HTTP.Auth.Basic != nil {
				content.WriteString(fmt.Sprintf("    username: %s\n", bru.HTTP.Auth.Basic.Username))
				content.WriteString(fmt.Sprintf("    password: %s\n", bru.HTTP.Auth.Basic.Password))
			}
		case "bearer":
			if bru.HTTP.Auth.Bearer != nil {
				content.WriteString(fmt.Sprintf("    token: %s\n", bru.HTTP.Auth.Bearer.Token))
			}
		case "api-key":
			if bru.HTTP.Auth.APIKey != nil {
				content.WriteString(fmt.Sprintf("    key: %s\n", bru.HTTP.Auth.APIKey.Key))
				content.WriteString(fmt.Sprintf("    value: %s\n", bru.HTTP.Auth.APIKey.Value))
				content.WriteString(fmt.Sprintf("    in: %s\n", bru.HTTP.Auth.APIKey.In))
			}
		}
		content.WriteString("  }\n")
	}
	content.WriteString("}\n\n")

	// Body section
	if bru.Body.Type != "" && bru.Body.Type != "none" {
		content.WriteString("body {\n")
		content.WriteString(fmt.Sprintf("  type: %s\n", bru.Body.Type))
		// Body.Data is set by the frontend save path; HTTP.Body is the legacy field.
		bodyContent := bru.Body.Data
		if bodyContent == "" {
			bodyContent = bru.HTTP.Body
		}
		if bodyContent != "" {
			content.WriteString("  data {\n")
			lines := strings.Split(bodyContent, "\n")
			for _, line := range lines {
				content.WriteString(fmt.Sprintf("    %s\n", line))
			}
			content.WriteString("  }\n")
		}
		content.WriteString("}\n\n")
	}

	// Vars section
	if len(bru.Vars) > 0 {
		content.WriteString("vars {\n")
		for key, value := range bru.Vars {
			switch v := value.(type) {
			case string:
				content.WriteString(fmt.Sprintf("  %s: \"%s\"\n", key, v))
			default:
				content.WriteString(fmt.Sprintf("  %s: %v\n", key, v))
			}
		}
		content.WriteString("}\n\n")
	}

	// Assertions section
	if len(bru.Assertions) > 0 {
		content.WriteString("assertions {\n")
		for _, assertion := range bru.Assertions {
			content.WriteString(fmt.Sprintf("  - %s\n", assertion))
		}
		content.WriteString("}\n")
	}

	return strings.TrimSpace(content.String())
}

// ParseCollection parses all .bru files in a collection directory
func ParseCollection(collectionPath string) ([]*BruFile, error) {
	entries, err := os.ReadDir(collectionPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read collection directory: %w", err)
	}

	var bruFiles []*BruFile
	bruRegex := regexp.MustCompile(`\.bru$`)

	for _, entry := range entries {
		if entry.IsDir() {
			// Recursively parse subdirectories
			subFiles, err := ParseCollection(collectionPath + "/" + entry.Name())
			if err != nil {
				continue
			}
			bruFiles = append(bruFiles, subFiles...)
		} else if bruRegex.MatchString(entry.Name()) {
			bru, err := Parse(collectionPath + "/" + entry.Name())
			if err != nil {
				continue
			}
			bruFiles = append(bruFiles, bru)
		}
	}

	return bruFiles, nil
}