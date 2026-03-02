# Hide Environments Folder from Collection Tree Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent the `environments/` directory and `.env` files from appearing in the collection sidebar tree.

**Architecture:** `GetCollectionStructure` in the collection repository uses `filepath.Walk`, which visits every file and directory including `environments/`. Adding two guards at the top of the Walk callback — one returning `filepath.SkipDir` for the `environments` directory and one returning `nil` for stray `.env` files — is the complete fix. No other code paths are affected.

**Tech Stack:** Go (`filepath.Walk`, `filepath.SkipDir`, `strings.HasSuffix`)

---

### Task 1: Add guards in `GetCollectionStructure` Walk callback

**Files:**
- Modify: `backend/internal/infrastructure/repository/collection_repository.go:175-213`

**Step 1: Open the file and locate the Walk callback**

The callback starts at line ~175 inside `GetCollectionStructure`. The first existing guard is the root-path skip at line ~181.

**Step 2: Add the two guards immediately after the root-path skip**

Find this block (after the `if err != nil` check):

```go
		// Skip the root directory
		if path == collectionPath {
			return nil
		}
```

Insert the two new guards directly below it:

```go
		// Skip the environments directory and all its contents.
		if info.IsDir() && info.Name() == "environments" {
			return filepath.SkipDir
		}
		// Skip any stray .env files outside environments/.
		if !info.IsDir() && strings.HasSuffix(info.Name(), ".env") {
			return nil
		}
```

The `strings` package is already imported. `filepath` is already imported. No new imports needed.

**Step 3: Verify the file compiles**

```bash
cd /home/numericlabs/data/rocket-api/backend
go build ./...
```

Expected: no output (clean build).

**Step 4: Run the full backend test suite**

```bash
cd /home/numericlabs/data/rocket-api/backend
go test ./... 2>&1
```

Expected: all packages pass or show `[no test files]`. No failures.

**Step 5: Commit**

```bash
cd /home/numericlabs/data/rocket-api
git add backend/internal/infrastructure/repository/collection_repository.go
git commit -m "fix(collection): hide environments folder from collection tree"
```

---

### Task 2: Push and verify

**Step 1: Push**

```bash
cd /home/numericlabs/data/rocket-api
git push
```

**Step 2: Manual smoke test**

1. Open the app and expand a collection in the sidebar.
2. Confirm `environments` folder is no longer visible under the collection.
3. Open the Environments dropdown — verify environments still load correctly.
4. Create a new request, save it — confirm it appears in the sidebar (not broken by this change).
