# Bruno Import Parity for Lockstep Collection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Bruno import/load parity complete for Lockstep-style collections by preserving method/url/auth/body/headers/query/path params and disabled (`~`) semantics across supported HTTP methods.

**Architecture:** Implement parser-first parity in `backend/pkg/bru/parser.go` by extending parsed structures for path params and enabled/disabled state, then propagate through request-load responses. Validate with parser and handler regression tests that reflect Lockstep request shapes.

**Tech Stack:** Go, standard `testing`, existing backend parser/handlers.

---

### Task 1: Add failing parser tests for path params and disabled markers

**Files:**
- Modify: `backend/pkg/bru/parser_test.go`

**Step 1: Write failing test for `params:path` parsing**
- Add test with Bruno content containing `params:path { userId: 42 }`.
- Assert parsed structure includes path param `userId=42` with `enabled=true`.

**Step 2: Write failing test for disabled markers**
- Add test with:
  - `headers { ~X-Group-Key: {{GroupKey}} }`
  - `params:query { ~page: 1 }`
  - `params:path { ~userId: 42 }`
- Assert entries are present with `enabled=false`.

**Step 3: Run targeted tests to confirm red state**
Run: `go test ./pkg/bru -run "Path|Disabled|params" -v`
Expected: FAIL due to missing parser support.

**Step 4: Commit tests**
```bash
git add backend/pkg/bru/parser_test.go
git commit -m "test(bru): add failing parity cases for path params and disabled markers"
```

### Task 2: Extend parser model and parsing logic

**Files:**
- Modify: `backend/pkg/bru/parser.go`
- Test: `backend/pkg/bru/parser_test.go`

**Step 1: Extend data model**
- Add `Enabled` to header entries or create a shared param type where appropriate.
- Add parsed `PathParams` collection in `BruFile.HTTP` (or equivalent consistent placement).

**Step 2: Implement parsing for `params:path` blocks**
- Parse entries in `params:path` similar to query parsing.
- Respect key/value splitting on first colon.

**Step 3: Implement `~` disabled marker parsing**
- For headers/query/path blocks, detect leading `~` key marker.
- Store key without `~` and `enabled=false`; default `enabled=true` otherwise.

**Step 4: Run targeted tests**
Run: `go test ./pkg/bru -run "Path|Disabled|BrunoMethodBlocks" -v`
Expected: PASS.

**Step 5: Run full parser test suite**
Run: `go test ./pkg/bru -v`
Expected: PASS.

**Step 6: Commit parser implementation**
```bash
git add backend/pkg/bru/parser.go backend/pkg/bru/parser_test.go
git commit -m "feat(bru): parse path params and disabled markers for bruno parity"
```

### Task 3: Propagate parsed parity fields through request-load response

**Files:**
- Modify: `backend/internal/interfaces/handlers/collection_handler.go`
- Modify: related DTO/response types if needed in handler package
- Test: `backend/internal/interfaces/http/handlers/collection_handler_test.go` or existing handler tests covering load

**Step 1: Update response payload mapping**
- Ensure request retrieval endpoint includes parsed path params and enabled flags for headers/query/path.

**Step 2: Add/adjust handler tests**
- Add a test fixture `.bru` with method/auth/body/headers/query/path including disabled markers.
- Assert API response fields match parsed values and enabled states.

**Step 3: Run handler tests**
Run: `go test ./internal/interfaces/http/handlers -run "GetRequest|Load|collection" -v`
Expected: PASS.

**Step 4: Commit handler propagation changes**
```bash
git add backend/internal/interfaces/handlers/collection_handler.go backend/internal/interfaces/http/handlers/collection_handler_test.go
git commit -m "feat(api): expose parsed path params and enabled flags in request load response"
```

### Task 4: Add Lockstep-focused regression fixture coverage

**Files:**
- Modify: `backend/internal/interfaces/handlers/import_export_handler_test.go`
- Optional create: `backend/internal/interfaces/handlers/testdata/lockstep-parity-sample.zip` (minimal fixture)

**Step 1: Add end-to-end import+parse test**
- Import zip fixture representing Lockstep-style `.bru` features.
- Parse/load one request per representative method type (`GET/POST/PUT/PATCH/DELETE/OPTIONS/HEAD`).

**Step 2: Assert parity fields**
- For each request: assert method/url/auth/body/headers/query/path + enabled flags are correct.

**Step 3: Run handler/import tests**
Run: `go test ./internal/interfaces/handlers -run "ImportBruno|Lockstep|Parity" -v`
Expected: PASS.

**Step 4: Commit regression tests**
```bash
git add backend/internal/interfaces/handlers/import_export_handler_test.go backend/internal/interfaces/handlers/testdata/lockstep-parity-sample.zip
git commit -m "test(import): add lockstep parity regression coverage across http methods"
```

### Task 5: Final verification

**Files:**
- No new files

**Step 1: Run backend verification**
Run:
- `go test ./pkg/bru -v`
- `go test ./internal/interfaces/handlers -v`
- `go test ./internal/interfaces/http/handlers -v`
Expected: PASS.

**Step 2: Confirm acceptance points**
- Confirm `params:path` is present in response.
- Confirm disabled entries are preserved.
- Confirm body/auth/query/header parity remains intact.

**Step 3: Capture final status**
Run:
- `git status --short`
- `git log --oneline -n 8`

