# Bruno Feature Parity Design

## Goal

Close the gap between Rocket and Bruno across four phased deliveries, each independently shippable.

## Phases

```
Phase 1  →  Dynamic variables + x-www-form-urlencoded body
Phase 2  →  Docs tab + folder-level variables
Phase 3  →  JavaScript scripting engine (Goja)
Phase 4  →  Test framework (tests {} block)
```

---

## Phase 1: Dynamic Variables + x-www-form-urlencoded

### Dynamic variables

Resolved client-side at send time inside `substituteRequestVariables` (`frontend/src/lib/environment.ts`). Tokens with a `$` prefix are intercepted before the normal variable lookup.

| Token | Value |
|---|---|
| `{{$timestamp}}` | Unix timestamp in seconds |
| `{{$isoTimestamp}}` | ISO 8601 datetime string |
| `{{$randomInt}}` | Random integer 0–1000 |
| `{{$uuid}}` | Random UUID v4 |
| `{{$randomEmail}}` | Random email address |

No backend changes required. Frontend-only.

### x-www-form-urlencoded body type

**Bruno `.bru` format:**
```
body:form {
  username: alice
  ~disabled_field: value
}
```

**Backend (`pkg/bru`):**
- New `FormField` struct: `Key string`, `Value string`, `Enabled bool`
- Add `FormFields []FormField` to `BruFile`
- Parser: handle `body:form { ... }` block — `~key: val` = disabled
- Generator: write `body:form { ... }` block; prefix disabled fields with `~`

**Backend (`request_handler.go`):**
- When `body.type == "form"`, encode enabled fields as `application/x-www-form-urlencoded`

**Frontend:**
- New "Form" option in body type selector
- Key-value row editor (same pattern as query params — no file fields)
- Disabled toggle per row

---

## Phase 2: Docs Tab + Folder-level Variables

### Docs tab

Per-request markdown stored in the `.bru` file.

**Bruno `.bru` format:**
```
docs {
  # My Request

  This request fetches all users from the API.
}
```

**Backend (`pkg/bru`):**
- Add `Docs string` to `BruFile`
- Parser: capture `docs { ... }` block content as raw string
- Generator: write `docs { ... }` block when non-empty

**Frontend:**
- New "Docs" tab in request builder
- Split view: textarea (left) + markdown preview (right)
- Saved alongside the request in the existing save flow

### Folder-level variables

Each folder can have a `folder.bru` file at its root with `vars {}` and `vars:secret []` blocks — identical format to `collection.bru`.

**Variable resolution hierarchy (highest → lowest):**
```
script vars  >  env vars  >  folder vars  >  collection vars
```

**Backend:**
- `ReadFolderVars(collection, folderPath) ([]CollectionVar, error)` — reads `<folder>/folder.bru`
- `WriteFolderVars(collection, folderPath, vars []CollectionVar) error`
- `GetCollectionStructure`: skip `folder.bru` files (same pattern as `collection.bru`)
- New handler methods: `GetFolderVars` / `SaveFolderVars`
- New routes: `GET /api/v1/collections/{name}/folder-vars?path=<relPath>` and `POST` equivalent

**Frontend:**
- Right-click folder in sidebar → "Edit Variables" opens `CollectionVariablesEditor` in a dialog
- Folder vars fetched when a request inside that folder is loaded (resolved via request's relative path)
- Folder vars merged into substitution between env and collection vars

---

## Phase 3: Scripting Engine

### Runtime

Embed [Goja](https://github.com/dop251/goja) — pure-Go JavaScript engine, no CGO. Same engine Bruno uses.

### Execution flow

```
1. Load BruFile (includes pre-request + post-response script strings)
2. Initialise Goja VM with bru/req objects
3. Execute script:pre-request → may mutate vars
4. Apply variable substitution (script vars have highest priority)
5. Send HTTP request
6. Inject res object into VM
7. Execute script:post-response → may read res, set vars
8. Collect console.log output
9. Return response + scriptOutput + updatedVars to frontend
```

### Bruno `.bru` format

```
script:pre-request {
  bru.setVar("token", bru.getEnvVar("API_KEY"))
}

script:post-response {
  const body = JSON.parse(res.body)
  bru.setVar("userId", body.id)
}
```

### `bru` API

```javascript
bru.setVar("key", value)       // set runtime variable (highest priority)
bru.getVar("key")              // read from runtime → env → folder → collection
bru.getEnvVar("key")           // read active environment variable
bru.setEnvVar("key", value)    // mutate active environment variable
```

### `req` object (pre-request)

```javascript
req.method    // string
req.url       // string
req.headers   // object
req.body      // string
```

### `res` object (post-response)

```javascript
res.status        // number
res.headers       // object
res.body          // string
res.responseTime  // number (ms)
res.getHeader(name)  // string
```

### Backend changes

- `pkg/bru`: parse `script:pre-request { ... }` and `script:post-response { ... }` blocks into `BruFile.Scripts.PreRequest` / `BruFile.Scripts.PostResponse` string fields; generate on write
- `internal/app/script_executor.go` (new): `ScriptExecutor` struct — initialises Goja VM, injects objects, runs script string, returns `ScriptResult{Vars map[string]string, ConsoleOutput []string, Error string}`
- Script errors are non-fatal — surfaced as a warning field in the response envelope
- Runtime vars are passed back to the frontend and merged into the active session vars

### Frontend changes

- Two new tabs in request builder: **"Pre-request"** and **"Post-response"** — Monaco editor with `javascript` language mode
- Script content saved alongside the request
- Console output shown in a collapsible panel below the script editor

---

## Phase 4: Test Framework

### Bruno `.bru` format

```
tests {
  test("status is 200", function() {
    expect(res.status).to.equal(200)
  })

  test("body has id", function() {
    const body = JSON.parse(res.body)
    expect(body.id).to.be.a("number")
  })
}
```

### `expect()` API (Bruno-compatible subset)

```javascript
expect(value).to.equal(x)
expect(value).to.be.a("type")      // "string", "number", "object", "array"
expect(value).to.include("substr")
expect(value).to.be.greaterThan(x)
expect(value).to.be.lessThan(x)
expect(value).to.be.null
expect(value).to.be.true
expect(value).to.be.false
expect(value).to.be.undefined
```

### Execution

Tests run after `script:post-response` in the same Goja VM — same `res`/`bru` objects available. Each `test()` call is collected into `[]TestResult{Name, Passed, Error}`.

### Backend changes

- `pkg/bru`: parse `tests { ... }` block into `BruFile.Tests string`; generate on write
- `ScriptExecutor`: after post-response script, inject `test()` and `expect()` implementations, run tests block, collect results
- Response envelope gains `"tests": [{name, passed, error}]` field

### Frontend changes

- New **"Tests"** tab in the **response panel** — shows pass/fail list with summary
- Tab label shows count badge: `Tests (4)`
- New **"Tests"** tab in the **request builder** — Monaco editor for writing the `tests {}` block

---

## Updated Request Builder Tab Layout

```
Request tabs:          Response tabs:
  Params                 Body
  Headers                Headers
  Body                   Raw
  Auth                   Tests  ← Phase 4
  Pre-request  ← Ph 3
  Post-response ← Ph 3
  Tests  ← Phase 4
  Docs   ← Phase 2
```

---

## Data Model Additions

### BruFile (pkg/bru)

```go
type FormField struct {
    Key     string `json:"key"`
    Value   string `json:"value"`
    Enabled bool   `json:"enabled"`
}

type BruFile struct {
    // ... existing fields ...
    FormFields []FormField `json:"formFields,omitempty"`
    Docs       string      `json:"docs,omitempty"`
    Scripts    struct {
        PreRequest   string `json:"preRequest,omitempty"`
        PostResponse string `json:"postResponse,omitempty"`
    } `json:"scripts,omitempty"`
    Tests string `json:"tests,omitempty"`
}
```

### Frontend types

```typescript
interface FormField {
  key: string
  value: string
  enabled: boolean
}

interface ScriptResult {
  consoleOutput: string[]
  error?: string
}

interface TestResult {
  name: string
  passed: boolean
  error?: string
}
```

---

## Out of Scope

- OAuth 2.0 auth (separate feature)
- GraphQL body type (separate feature)
- gRPC / WebSocket (separate feature)
- Collection runner / sequential execution
- Postman-specific features
