# Collection Folder and In-Folder Request Creation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Postman/Bruno-like ability to create folders and create requests inside selected folders from the collections sidebar.

**Architecture:** Add explicit backend APIs for folder creation and new request creation under a parent path, then wire frontend API/store/sidebar actions to call those endpoints and refresh/expand tree state. Keep request tab open/focus logic centralized in `tabs-store` and unchanged.

**Tech Stack:** Go (net/http + repository layer), React, TypeScript, Zustand, Axios, Vitest, Go test, Yarn

---

### Task 1: Add backend tests for folder/request creation APIs

**Files:**
- Modify: `backend/internal/interfaces/http/handlers/collection_handler_test.go`
- Modify: `backend/internal/infrastructure/repository/collection_repository_test.go`

**Step 1: Write the failing test**

Add HTTP handler tests for:
- `POST /api/v1/collections/{name}/folders` creates root folder
- `POST /api/v1/collections/{name}/folders` creates nested folder with `parentPath`
- `POST /api/v1/collections/{name}/requests/new` creates `.bru` under parent folder
- duplicate folder/request returns conflict
- traversal payload rejected

Add repository tests for safe path creation and duplicate detection.

**Step 2: Run test to verify it fails**

Run:
- `cd backend && go test ./internal/interfaces/http/handlers -run Folder -v`
- `cd backend && go test ./internal/infrastructure/repository -run Folder -v`

Expected: FAIL due to missing endpoints/repository methods.

**Step 3: Write minimal implementation**

No implementation in this task.

**Step 4: Run test to verify red state is stable**

Run same commands above.
Expected: only new tests fail for missing behavior.

**Step 5: Commit**

```bash
git add backend/internal/interfaces/http/handlers/collection_handler_test.go backend/internal/infrastructure/repository/collection_repository_test.go
git commit -m "test(backend): add folder and nested request creation API coverage"
```

### Task 2: Implement backend folder creation endpoint

**Files:**
- Modify: `backend/internal/infrastructure/repository/collection_repository.go`
- Modify: `backend/internal/interfaces/http/handlers/collection_handler.go`
- Modify: `backend/cmd/server/main.go`
- Test: `backend/internal/interfaces/http/handlers/collection_handler_test.go`
- Test: `backend/internal/infrastructure/repository/collection_repository_test.go`

**Step 1: Write the failing test**

Use Task 1 tests as red baseline for folder creation.

**Step 2: Run test to verify it fails**

Run:
- `cd backend && go test ./internal/interfaces/http/handlers -run Folder -v`

Expected: FAIL on folder endpoint cases.

**Step 3: Write minimal implementation**

Implement repository method and handler logic:

```go
func (r *CollectionRepository) CreateFolder(collectionName, parentPath, folderName string) (string, error) {
    // validate name + parentPath (no absolute, no traversal)
    // target := filepath.Join(basePath, collectionName, parentPath, folderName)
    // fail with os.ErrExist-style conflict if already exists
    // os.MkdirAll(target, 0755)
    // return relative path
}
```

Add route in server setup and handler payload parsing for `parentPath` + `folderName`.

**Step 4: Run test to verify it passes**

Run:
- `cd backend && go test ./internal/interfaces/http/handlers -run Folder -v`
- `cd backend && go test ./internal/infrastructure/repository -run Folder -v`

Expected: PASS for folder creation tests.

**Step 5: Commit**

```bash
git add backend/internal/infrastructure/repository/collection_repository.go backend/internal/interfaces/http/handlers/collection_handler.go backend/cmd/server/main.go backend/internal/interfaces/http/handlers/collection_handler_test.go backend/internal/infrastructure/repository/collection_repository_test.go
git commit -m "feat(backend): add collection folder creation endpoint"
```

### Task 3: Implement backend request creation in selected folder

**Files:**
- Modify: `backend/internal/infrastructure/repository/collection_repository.go`
- Modify: `backend/internal/interfaces/http/handlers/collection_handler.go`
- Modify: `backend/cmd/server/main.go`
- Test: `backend/internal/interfaces/http/handlers/collection_handler_test.go`

**Step 1: Write the failing test**

Add tests for:
- creating request in collection root
- creating request under nested folder
- duplicate request path conflict
- invalid request name/path rejection

**Step 2: Run test to verify it fails**

Run:
- `cd backend && go test ./internal/interfaces/http/handlers -run Request.*New -v`

Expected: FAIL on new request endpoint tests.

**Step 3: Write minimal implementation**

Add handler + repository method to generate starter `.bru`:

```go
func (r *CollectionRepository) CreateRequestFile(collectionName, parentPath, requestName, method string) (string, error) {
    // sanitize
    // targetRel := filepath.Join(parentPath, requestName+".bru")
    // if exists -> conflict
    // write minimal bru content via existing WriteBruFile/WriteFile path
    // return targetRel
}
```

**Step 4: Run test to verify it passes**

Run:
- `cd backend && go test ./internal/interfaces/http/handlers -run Request.*New -v`

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/internal/infrastructure/repository/collection_repository.go backend/internal/interfaces/http/handlers/collection_handler.go backend/cmd/server/main.go backend/internal/interfaces/http/handlers/collection_handler_test.go
git commit -m "feat(backend): add request creation endpoint with parent folder path"
```

### Task 4: Add frontend API client methods and failing UI tests

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Create/Modify tests: `frontend/src/components/collections/__tests__/CollectionsSidebar.test.tsx` (or existing sidebar test file)

**Step 1: Write the failing test**

Add UI tests to verify:
- collection/folder node actions show `New Folder` and `New Request`
- submit calls API with proper `parentPath`

**Step 2: Run test to verify it fails**

Run:
- `cd frontend && yarn -s test src/components/collections --run`

Expected: FAIL on missing UI actions/API calls.

**Step 3: Write minimal implementation**

Add API methods:

```ts
async createFolder(collection: string, parentPath: string | undefined, folderName: string): Promise<{ path: string }>
async createRequest(collection: string, parentPath: string | undefined, requestName: string, method?: string): Promise<{ path: string }>
```

**Step 4: Run test to verify it still fails only on UI wiring**

Run same command.
Expected: API layer compile/tests pass; UI behavior still red if not yet wired.

**Step 5: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/components/collections/__tests__/CollectionsSidebar.test.tsx
git commit -m "test(frontend): add sidebar creation action coverage and api client methods"
```

### Task 5: Wire sidebar create-folder/create-request flows

**Files:**
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx`
- Modify: `frontend/src/store/collections.ts` (if adding helper actions)
- Test: `frontend/src/components/collections/__tests__/CollectionsSidebar.test.tsx`

**Step 1: Write the failing test**

Use Task 4 UI tests as red baseline.

**Step 2: Run test to verify it fails**

Run:
- `cd frontend && yarn -s test src/components/collections --run`

Expected: FAIL in action dialog flows.

**Step 3: Write minimal implementation**

- Add sidebar dialog state for create mode (`folder`/`request`) + parent context.
- Add dropdown actions on collection/folder nodes.
- On submit:
  - call relevant `apiService` method
  - refresh tree for active collection
  - expand parent folder chain
  - if request created, call `loadRequestFromPath(collection, createdPath)`

**Step 4: Run test to verify it passes**

Run:
- `cd frontend && yarn -s test src/components/collections --run`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/collections/CollectionsSidebar.tsx frontend/src/store/collections.ts frontend/src/components/collections/__tests__/CollectionsSidebar.test.tsx
git commit -m "feat(frontend): add folder and in-folder request creation from collections sidebar"
```

### Task 6: End-to-end verification and cleanup

**Files:**
- Verify only (unless fixes needed)

**Step 1: Write the failing test**

No new tests.

**Step 2: Run verification tests**

Run:
- `cd backend && go test ./...`
- `cd frontend && yarn -s lint`
- `cd frontend && yarn -s test`

Expected: all pass; or document unrelated pre-existing failures.

**Step 3: Write minimal implementation**

Only patch any regressions found during verification.

**Step 4: Re-run verification**

Run the same commands until stable.

**Step 5: Commit**

```bash
# only if verification fixes were needed
git add -A
git commit -m "chore: finalize folder and in-folder request creation verification"
```

## Implementation Notes
- Keep all path validation centralized in backend repository helpers.
- Ensure returned relative paths use forward slashes for frontend consistency.
- Preserve tab dedupe/open behavior by continuing to route request opening through `loadRequestFromPath`.
