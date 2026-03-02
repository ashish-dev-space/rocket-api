# Collection Save/Load Fix Design

**Date:** 2026-03-02
**Status:** Approved
**Goal:** Fix requests loading as empty after save, and sidebar not refreshing after save.

---

## Root Cause

Two independent bugs combine to make the collections feature appear broken.

### Bug 1 — bru parser/writer format mismatch (backend)

`bru.GenerateContent` (`backend/pkg/bru/parser.go`) writes `.bru` files in block syntax:

```
meta {
  name: My Request
  type: http
  seq: 1
}
http {
  method: GET
  url: https://example.com
  headers {
    Content-Type: application/json
  }
}
```

`bru.ParseContent` looks for section headers ending with `:` (e.g. `meta:`, `body:`). It never enters any section when reading block-syntax files, so it returns a zero-value `BruFile`. Every loaded request comes back with blank name, method, and URL.

The sidebar also calls `bru.Parse` to populate node names and methods in `GetCollectionStructure`, so saved requests appear with empty labels.

### Bug 2 — sidebar not refreshed after save (frontend)

After `saveActiveTab` completes, `fetchCollectionTree` is never called. Newly saved requests don't appear in the sidebar tree until the user manually toggles the collection.

---

## Design

### Fix 1 — Rewrite `bru.ParseContent` to handle block syntax

**File:** `backend/pkg/bru/parser.go` — replace `ParseContent` only. `GenerateContent` is correct and unchanged.

The new parser tracks a section stack. Rules:

- A line matching `word {` (with optional leading whitespace) pushes the word onto a context stack.
- A line that is just `}` pops the context stack.
- Within the `meta` context: parse `name:`, `type:`, `seq:` key-value lines.
- Within the `http` context: parse `method:`, `url:` lines; push sub-contexts for `headers`, `query`, and `auth`.
  - Within `headers`: each `key: value` line appends a `Header`.
  - Within `query`: each `key: value` line appends a `QueryParam` (enabled: true).
  - Within `auth`: parse `type:`, `username:`, `password:`, `token:`, `key:`, `value:`, `in:` lines.
- Within the `body` context: parse `type:` line; push sub-context for `data`.
  - Within `data`: accumulate indented lines as body content.

This handles everything `GenerateContent` currently writes.

### Fix 2 — Refresh collection tree after save

**File:** `frontend/src/components/request-builder/RequestBuilder.tsx`

After `await saveActiveTab(activeCollection.name)` in `handleSaveRequest`, add:

```ts
useCollectionsStore.getState().fetchCollectionTree(activeCollection.name)
```

`getState()` avoids adding the store as a hook dependency on the `useCallback`.

---

## Files Changed

| File | Change |
|------|--------|
| `backend/pkg/bru/parser.go` | Rewrite `ParseContent` to handle `{ }` block syntax |
| `frontend/src/components/request-builder/RequestBuilder.tsx` | Trigger `fetchCollectionTree` after successful save |

---

## Out of Scope

The sidebar has a UX quirk where clicking the expand chevron and clicking the collection name are separate actions (only the name click sets the active collection). This is a separate UX improvement, not related to the save/load bug.
