# Bruno Inline JSON Body Parse Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix backend `.bru` parsing so imported Bruno inline `body:json { ... }` payloads are returned fully (no truncation), including nested braces and JSONC constructs.

**Architecture:** Update `backend/pkg/bru/parser.go` body-capture termination logic to be indentation-aware. Add focused parser tests for nested JSON and JSONC-style payloads and a handler-level import/load regression test path to verify end-to-end response correctness.

**Tech Stack:** Go, `testing` package, existing Bruno parser and HTTP handlers.

---

### Task 1: Add failing parser test for nested inline body block

**Files:**
- Modify: `backend/pkg/bru/parser_test.go`

**Step 1: Write the failing test**
- Add a test for `body:json { ... }` with nested object braces where expected parsed `body.data` contains all closing braces.
- Name suggestion: `TestParseContentBrunoInlineBodyBlockWithNestedObject`.

**Step 2: Run test to verify it fails**
Run: `go test ./pkg/bru -run TestParseContentBrunoInlineBodyBlockWithNestedObject -v`
Expected: FAIL showing truncated `body.data` or mismatch with expected body content.

**Step 3: Commit failing test**
```bash
git add backend/pkg/bru/parser_test.go
git commit -m "test(bru): add failing nested inline body parse regression"
```

### Task 2: Implement indentation-aware block close logic

**Files:**
- Modify: `backend/pkg/bru/parser.go`
- Test: `backend/pkg/bru/parser_test.go`

**Step 1: Implement minimal parser change**
- Track indentation level when entering `data {` or `body:<type> {` body-capture blocks.
- In capture mode, close block only when `}` line indentation equals opening block indentation.
- Keep inner/deeper braces as body content.
- Preserve current body text behavior (no normalization).

**Step 2: Run targeted parser tests**
Run: `go test ./pkg/bru -run "TestParseContentBrunoInlineBodyBlock|TestParseContentBrunoInlineBodyBlockWithNestedObject" -v`
Expected: PASS.

**Step 3: Run full parser package tests**
Run: `go test ./pkg/bru -v`
Expected: PASS all tests.

**Step 4: Commit implementation**
```bash
git add backend/pkg/bru/parser.go backend/pkg/bru/parser_test.go
git commit -m "fix(bru): parse inline body blocks without truncating nested json"
```

### Task 3: Add JSONC retention regression test

**Files:**
- Modify: `backend/pkg/bru/parser_test.go`

**Step 1: Write test for comments/trailing comma retention**
- Add test payload using Bruno-style comments and trailing commas.
- Assert parsed `body.data` includes representative comment lines and trailing-comma structure (string contains assertions).

**Step 2: Run test to verify behavior**
Run: `go test ./pkg/bru -run TestParseContentBrunoInlineBodyBlockJSONCRetention -v`
Expected: PASS (after parser fix in Task 2).

**Step 3: Run parser package tests again**
Run: `go test ./pkg/bru -v`
Expected: PASS.

**Step 4: Commit test coverage**
```bash
git add backend/pkg/bru/parser_test.go
git commit -m "test(bru): cover jsonc retention in inline json body parsing"
```

### Task 4: Add end-to-end handler regression coverage

**Files:**
- Modify: `backend/internal/interfaces/handlers/import_export_handler_test.go`
- Optional Modify: `backend/internal/interfaces/handlers/request_handler_test.go` (if load endpoint coverage is cleaner there)

**Step 1: Add test fixture zip content in test**
- Build a minimal in-memory zip with one `.bru` file using inline `body:json` and nested object braces.
- Import through `ImportBruno` handler and then parse/load via repository/parser path used by request retrieval.

**Step 2: Assert full body appears in backend response model**
- Verify returned `body.type == "json"`.
- Verify `body.data` contains closing braces and expected nested fields.

**Step 3: Run handler tests**
Run: `go test ./internal/interfaces/handlers -run "ImportBruno|Request" -v`
Expected: PASS.

**Step 4: Commit handler regression test**
```bash
git add backend/internal/interfaces/handlers/import_export_handler_test.go backend/internal/interfaces/handlers/request_handler_test.go
git commit -m "test(handlers): verify imported bruno inline json body is returned intact"
```

### Task 5: Final verification before completion

**Files:**
- No new files

**Step 1: Run focused backend verification suite**
Run:
- `go test ./pkg/bru -v`
- `go test ./internal/interfaces/handlers -v`
Expected: PASS.

**Step 2: Capture proof in summary**
- Record key passing test names and confirm truncation regression is covered.

**Step 3: Final commit (if squashing preferred by maintainer, skip this and keep prior commits)**
```bash
git status
git log --oneline -n 5
```

