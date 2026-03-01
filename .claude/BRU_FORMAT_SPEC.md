# .bru File Format Specification

**Version**: 1.0.0
**Status**: Draft
**Date**: 2026-03-01
**Compatibility**: Bruno 0.x compatible

## Overview

The `.bru` file format is a human-readable, YAML-like text format for defining HTTP API requests. Each `.bru` file represents a single HTTP request with metadata, configuration, and optional assertions.

## File Structure

### Basic Anatomy

```
meta:
  <metadata-section>

http:
  <http-request-section>

body:
  <request-body-section>

vars:
  <variables-section>

assertions:
  <assertions-section>

script:
  <script-section>
```

### Section Order

Sections MUST appear in this order (optional sections can be omitted):
1. `meta` (required)
2. `http` (required)
3. `body` (optional)
4. `vars` (optional)
5. `assertions` (optional)
6. `script` (optional)

## Section Specifications

### 1. Meta Section (Required)

**Purpose**: Metadata about the request.

**Format**:
```yaml
meta:
  name: <string>
  type: <"http" | "graphql" | "websocket">
  seq: <integer>
```

**Field Specifications**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `name` | string | Yes | Human-readable request name | 1-200 chars, no leading/trailing whitespace |
| `type` | enum | Yes | Request type | Must be: "http", "graphql", or "websocket" |
| `seq` | integer | No | Sequence number for ordering | >= 1 |

**Examples**:
```yaml
# Valid
meta:
  name: Get Users
  type: http
  seq: 1

# Valid (minimal)
meta:
  name: Login
  type: http

# Invalid (missing required field)
meta:
  type: http
# ERROR: 'name' is required

# Invalid (invalid type)
meta:
  name: Test
  type: rest
# ERROR: 'type' must be 'http', 'graphql', or 'websocket'
```

### 2. HTTP Section (Required)

**Purpose**: HTTP request configuration.

**Format**:
```yaml
http:
  method: <HTTP-METHOD>
  url: <string>
  headers:
    - key: <string>
      value: <string>
  params:
    - key: <string>
      value: <string>
  auth:
    type: <auth-type>
    <auth-specific-fields>
```

**Field Specifications**:

#### method (Required)

| Value | Description |
|-------|-------------|
| `GET` | Retrieve resource |
| `POST` | Create resource |
| `PUT` | Update resource (full) |
| `PATCH` | Update resource (partial) |
| `DELETE` | Delete resource |
| `HEAD` | Get headers only |
| `OPTIONS` | Get supported methods |

**Validation**: MUST be one of the above values (case-sensitive).

#### url (Required)

- **Type**: string
- **Format**: Valid URL or URL template with variables
- **Length**: 1-4096 characters
- **Variables**: Supports `{{variableName}}` syntax
- **Validation**: Must be valid URL after variable substitution

**Examples**:
```yaml
url: https://api.example.com/users
url: {{baseUrl}}/users/{{userId}}
url: http://localhost:3000/api/v1/posts
```

#### headers (Optional)

Array of key-value pairs for HTTP headers.

**Format**:
```yaml
headers:
  - key: Content-Type
    value: application/json
  - key: Authorization
    value: Bearer {{token}}
```

**Field Validation**:
- `key`: 1-200 chars, standard HTTP header name format
- `value`: 0-8192 chars, supports variable substitution
- Duplicate keys allowed (multi-value headers)

**Standard Headers**:
```yaml
# Common examples
- key: Content-Type
  value: application/json

- key: Accept
  value: application/json

- key: Authorization
  value: Bearer {{token}}

- key: User-Agent
  value: Rocket-API/1.0
```

#### params (Optional)

Array of query parameters.

**Format**:
```yaml
params:
  - key: page
    value: 1
  - key: limit
    value: 20
  - key: filter
    value: {{searchTerm}}
```

**Behavior**:
- Appended to URL with `?` separator
- Multiple params joined with `&`
- Values are URL-encoded automatically
- Supports variable substitution

**URL Construction**:
```yaml
# Input
url: https://api.example.com/users
params:
  - key: page
    value: 2
  - key: limit
    value: 10

# Result
# https://api.example.com/users?page=2&limit=10
```

#### auth (Optional)

Authentication configuration.

**Format**:
```yaml
auth:
  type: <auth-type>
  # Type-specific fields
```

**Supported Types**:

**1. None**
```yaml
auth:
  type: none
```

**2. Basic Authentication**
```yaml
auth:
  type: basic
  username: {{username}}
  password: {{password}}
```

**3. Bearer Token**
```yaml
auth:
  type: bearer
  token: {{authToken}}
```

**4. API Key**
```yaml
auth:
  type: apikey
  key: X-API-Key
  value: {{apiKey}}
  in: header  # or "query"
```

**Validation**:
- `type`: Must be "none", "basic", "bearer", or "apikey"
- Fields validated based on type
- Missing required fields for type = error

### 3. Body Section (Optional)

**Purpose**: Request body content.

**Format**:
```yaml
body:
  type: <body-type>
  data: <content>
```

**Supported Types**:

#### none
```yaml
body:
  type: none
```

#### json
```yaml
body:
  type: json
  data: |
    {
      "name": "{{userName}}",
      "email": "{{userEmail}}",
      "age": 25
    }
```

**Validation**:
- `data` must be valid JSON after variable substitution
- Syntax validated before sending request
- Pretty-printed when saving file

#### xml
```yaml
body:
  type: xml
  data: |
    <?xml version="1.0"?>
    <user>
      <name>{{userName}}</name>
      <email>{{userEmail}}</email>
    </user>
```

#### form-urlencoded
```yaml
body:
  type: form-urlencoded
  data: |
    name={{userName}}
    email={{userEmail}}
    subscribe=true
```

**Format**: `key=value` pairs, one per line.

#### multipart
```yaml
body:
  type: multipart
  data: |
    name={{userName}}
    email={{userEmail}}
    file=@/path/to/file.pdf
```

**Special Syntax**:
- `@` prefix for file paths: `file=@/path/to/image.jpg`
- Regular fields: `key=value`

#### text
```yaml
body:
  type: text
  data: |
    Plain text content here.
    Supports {{variables}}.
    Multiple lines allowed.
```

#### binary
```yaml
body:
  type: binary
  file: /path/to/file.bin
```

**Field**: `file` path instead of `data`.

### 4. Vars Section (Optional)

**Purpose**: Request-specific variables.

**Format**:
```yaml
vars:
  variableName: value
  anotherVar: {{derivedFromEnv}}
```

**Characteristics**:
- Key-value pairs
- Keys: Alphanumeric + underscore, start with letter
- Values: Any string, supports variable substitution
- Scoped to this request only

**Usage**:
```yaml
vars:
  userId: 123
  endpoint: /users/{{userId}}
  expectedStatus: 200

http:
  url: {{baseUrl}}{{endpoint}}
```

### 5. Assertions Section (Optional)

**Purpose**: Response validation rules.

**Format**:
```yaml
assertions:
  - <assertion-expression>
  - <assertion-expression>
```

**Supported Assertions**:

```yaml
assertions:
  # Status code
  - status == 200
  - status >= 200 && status < 300

  # Response body (JSON)
  - response.body.id != null
  - response.body.email == "{{expectedEmail}}"
  - response.body.users.length > 0

  # Response headers
  - response.headers["content-type"] contains "application/json"

  # Response time
  - response.time < 1000

  # Response size
  - response.size < 1000000
```

**Operators**:
- Comparison: `==`, `!=`, `>`, `>=`, `<`, `<=`
- Logical: `&&`, `||`
- String: `contains`, `startsWith`, `endsWith`
- Existence: `!= null`, `== null`

### 6. Script Section (Optional)

**Purpose**: Pre-request and post-response JavaScript execution.

**Format**:
```yaml
script:
  pre-request: |
    // JavaScript executed before request
    const timestamp = Date.now();
    bru.setVar("timestamp", timestamp);

  post-response: |
    // JavaScript executed after response
    const token = res.body.token;
    bru.setVar("authToken", token);
    bru.setEnvVar("token", token);
```

**Available APIs**:

```javascript
// Variable management
bru.setVar(key, value)      // Set request variable
bru.getVar(key)             // Get request variable
bru.setEnvVar(key, value)   // Set environment variable
bru.getEnvVar(key)          // Get environment variable

// Request object (pre-request)
req.url                     // Modify URL
req.headers                 // Modify headers
req.body                    // Modify body

// Response object (post-response)
res.status                  // Response status code
res.headers                 // Response headers
res.body                    // Response body (parsed JSON)
res.time                    // Response time in ms
res.size                    // Response size in bytes

// Assertions
expect(res.status).to.equal(200)
expect(res.body.id).to.exist
```

## Variable Substitution

### Syntax

Variables are referenced using double curly braces:
```
{{variableName}}
```

### Variable Sources (Priority Order)

1. **Request Variables** (`vars` section in .bru file)
2. **Environment Variables** (from selected .env file)
3. **Global Variables** (application-level variables)

### Substitution Algorithm

```
1. Scan text for {{...}} patterns
2. Extract variable name
3. Lookup in priority order:
   a. Request vars
   b. Environment vars
   c. Global vars
4. Replace with value or leave unchanged if not found
5. Repeat until no more {{...}} patterns
6. Detect circular references (max 10 iterations)
```

### Examples

**Simple Substitution**:
```yaml
http:
  url: {{baseUrl}}/users

# If baseUrl = "https://api.example.com"
# Result: https://api.example.com/users
```

**Nested Substitution**:
```yaml
vars:
  apiVersion: v1
  endpoint: /{{apiVersion}}/users

http:
  url: {{baseUrl}}{{endpoint}}

# If baseUrl = "https://api.example.com"
# Result: https://api.example.com/v1/users
```

**Multiple Variables**:
```yaml
http:
  url: {{protocol}}://{{host}}:{{port}}/{{path}}

# If:
#   protocol = "https"
#   host = "api.example.com"
#   port = "443"
#   path = "users"
# Result: https://api.example.com:443/users
```

### Edge Cases

**Missing Variable**:
```yaml
url: {{baseUrl}}/users

# If baseUrl is not defined:
# Result: {{baseUrl}}/users (unchanged)
# WARNING: Variable 'baseUrl' not found
```

**Circular Reference**:
```yaml
vars:
  a: {{b}}
  b: {{a}}

# ERROR: Circular reference detected: a -> b -> a
```

**Escaped Braces**:
```yaml
# To use literal {{ in text:
body:
  type: text
  data: |
    Use \{{ and \}} for literal braces

# Result: Use {{ and }} for literal braces
```

## File Encoding

- **Character Encoding**: UTF-8 (with BOM optional)
- **Line Endings**: LF (`\n`) or CRLF (`\r\n`) accepted
- **Indentation**: 2 spaces (recommended) or 4 spaces
- **Max File Size**: 10 MB

## Validation Rules

### Parser Behavior

**On Parse**:
1. Validate UTF-8 encoding
2. Check section order
3. Validate required sections exist
4. Validate field types and values
5. Check variable syntax (not resolution)
6. Validate JSON/XML syntax in body

**Validation Modes**:

**Strict Mode** (default):
- Unknown fields = error
- Invalid field types = error
- Missing required fields = error
- Invalid section order = error

**Lenient Mode**:
- Unknown fields = warning, ignored
- Invalid field types = warning, skip field
- Missing optional sections = ok
- Section order flexible

### Error Messages

**Format**:
```
[ERROR] <file>:<line>:<column>: <message>

Example:
[ERROR] login.bru:5:3: Unknown field 'methd'. Did you mean 'method'?
[ERROR] users.bru:12:10: Invalid URL format
```

## File Operations

### Reading .bru Files

```go
// Pseudocode
func ParseBruFile(filepath string) (*BruFile, error) {
    // 1. Read file
    content, err := os.ReadFile(filepath)
    if err != nil {
        return nil, fmt.Errorf("failed to read file: %w", err)
    }

    // 2. Validate UTF-8
    if !utf8.Valid(content) {
        return nil, errors.New("file is not valid UTF-8")
    }

    // 3. Parse sections
    sections, err := parseSections(content)
    if err != nil {
        return nil, err
    }

    // 4. Validate structure
    if err := validateStructure(sections); err != nil {
        return nil, err
    }

    // 5. Build BruFile object
    bruFile := buildBruFile(sections)

    return bruFile, nil
}
```

### Writing .bru Files

```go
// Pseudocode
func WriteBruFile(filepath string, bruFile *BruFile) error {
    // 1. Serialize to .bru format
    content := serializeToBru(bruFile)

    // 2. Validate generated content
    if err := validateBruContent(content); err != nil {
        return err
    }

    // 3. Write to file
    return os.WriteFile(filepath, []byte(content), 0644)
}

func serializeToBru(bruFile *BruFile) string {
    var buf strings.Builder

    // Meta section
    buf.WriteString("meta:\n")
    buf.WriteString(fmt.Sprintf("  name: %s\n", bruFile.Meta.Name))
    buf.WriteString(fmt.Sprintf("  type: %s\n", bruFile.Meta.Type))
    if bruFile.Meta.Seq > 0 {
        buf.WriteString(fmt.Sprintf("  seq: %d\n", bruFile.Meta.Seq))
    }
    buf.WriteString("\n")

    // HTTP section
    buf.WriteString("http:\n")
    buf.WriteString(fmt.Sprintf("  method: %s\n", bruFile.HTTP.Method))
    buf.WriteString(fmt.Sprintf("  url: %s\n", bruFile.HTTP.URL))

    // Headers
    if len(bruFile.HTTP.Headers) > 0 {
        buf.WriteString("  headers:\n")
        for _, h := range bruFile.HTTP.Headers {
            buf.WriteString(fmt.Sprintf("    - key: %s\n", h.Key))
            buf.WriteString(fmt.Sprintf("      value: %s\n", h.Value))
        }
    }

    // ... continue for other sections

    return buf.String()
}
```

## Examples

### Complete Example

```yaml
meta:
  name: Create User
  type: http
  seq: 1

http:
  method: POST
  url: {{baseUrl}}/api/v1/users
  headers:
    - key: Content-Type
      value: application/json
    - key: Authorization
      value: Bearer {{authToken}}
  auth:
    type: bearer
    token: {{authToken}}

body:
  type: json
  data: |
    {
      "name": "{{userName}}",
      "email": "{{userEmail}}",
      "role": "user",
      "preferences": {
        "newsletter": true
      }
    }

vars:
  expectedStatus: 201

assertions:
  - status == {{expectedStatus}}
  - response.body.id != null
  - response.body.email == "{{userEmail}}"
  - response.time < 2000

script:
  post-response: |
    const userId = res.body.id;
    bru.setEnvVar("createdUserId", userId);
    console.log("Created user:", userId);
```

### Minimal Example

```yaml
meta:
  name: Health Check
  type: http

http:
  method: GET
  url: {{baseUrl}}/health
```

### GraphQL Example

```yaml
meta:
  name: Get User Query
  type: graphql

http:
  method: POST
  url: {{graphqlEndpoint}}
  headers:
    - key: Content-Type
      value: application/json

body:
  type: json
  data: |
    {
      "query": "query GetUser($id: ID!) { user(id: $id) { name email } }",
      "variables": {
        "id": "{{userId}}"
      }
    }

assertions:
  - status == 200
  - response.body.data.user != null
```

## Compatibility Notes

### Bruno Compatibility

This specification aims for compatibility with Bruno's .bru format. Key differences:

1. **Extended auth types**: We support additional auth methods
2. **Script API**: Our `bru` API may have additional methods
3. **Validation**: We enforce stricter validation by default

### Migration Path

Files created with Rocket API should be readable by Bruno and vice versa for common features.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-01 | Initial specification |

## References

- Bruno Documentation: https://docs.usebruno.com/
- HTTP/1.1 Specification: RFC 7230-7235
- JSON Specification: RFC 8259
- YAML Specification: https://yaml.org/spec/
