# Collections Navigation Postman/Bruno Behavior Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make collection-list request opening behavior match Postman/Bruno semantics by focusing open tabs, reusing clean active tabs, and prompting on dirty active tabs.

**Architecture:** Keep navigation policy in `tabs-store` as a single decision path, with `CollectionsSidebar` handling only user confirmation UX when required. Preserve tab-scoped save targeting so collection selection cannot redirect saves to the wrong request.

**Tech Stack:** React 19, TypeScript, Zustand store (`tabs-store`), existing API client, Vitest + Testing Library.

---

## Background reading

- `frontend/src/store/tabs-store.ts`
- `frontend/src/components/collections/CollectionsSidebar.tsx`
- `frontend/src/components/request-builder/RequestTabs.tsx`
- `frontend/src/store/__tests__/tabs-store.save-target-and-dirty.test.ts`

---

### Task 1: Add failing tests for navigation policy

**Files:**
- Modify: `frontend/src/store/__tests__/tabs-store.save-target-and-dirty.test.ts`

**Step 1: Write failing tests**

Add tests for:

- already-open request click focuses existing tab and avoids reload
- clean active tab is reused for new request
- dirty active tab returns `requiresConfirmation` outcome

**Step 2: Run tests and confirm failure**

```bash
cd frontend
yarn test src/store/__tests__/tabs-store.save-target-and-dirty.test.ts
```

Expected: FAIL on missing policy behavior.

**Step 3: Commit failing tests (optional checkpoint)**

```bash
git add frontend/src/store/__tests__/tabs-store.save-target-and-dirty.test.ts
git commit -m "test(frontend): add failing tests for Postman/Bruno nav policy"
```

---

### Task 2: Implement store action for open/focus/reuse/confirm decision

**Files:**
- Modify: `frontend/src/store/tabs-store.ts`
- Modify: `frontend/src/store/__tests__/tabs-store.save-target-and-dirty.test.ts`

**Step 1: Add decision action**

Implement store method (name flexible), e.g.:

- `openRequestFromCollection(collectionName, path)`

Result contract example:

```ts
type OpenRequestResult =
  | { kind: 'focused-existing'; tabId: string }
  | { kind: 'reused-active'; tabId: string }
  | { kind: 'requires-confirmation'; tabId: string; collectionName: string; path: string }
  | { kind: 'loaded'; tabId: string }
```

**Step 2: Implement policy order**

1. Existing tab by `collectionName + filePath` -> focus it.
2. Else active request tab clean -> reuse active tab.
3. Else active request tab dirty -> return confirmation-required.
4. Else active non-request tab -> create/select request tab and load.

**Step 3: Keep load logic centralized**

- Extract request-load internals into helper used by both direct open and post-confirm flows.
- Keep async updates bound to intended tab id.

**Step 4: Run tests**

```bash
cd frontend
yarn test src/store/__tests__/tabs-store.save-target-and-dirty.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/store/tabs-store.ts frontend/src/store/__tests__/tabs-store.save-target-and-dirty.test.ts
git commit -m "feat(frontend): implement Postman/Bruno request open policy"
```

---

### Task 3: Wire dirty-tab confirmation UX in CollectionsSidebar

**Files:**
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx`
- Modify: `frontend/src/store/tabs-store.ts` (if helper actions needed)
- Create/Modify tests if present: `frontend/src/components/collections/__tests__/...`

**Step 1: Add failing interaction test (or minimal harness)**

Cover behavior:

- click request from dirty active tab -> confirmation appears
- `Cancel` -> no navigation
- `Discard` -> request loads
- `Save` -> save then load

**Step 2: Implement sidebar integration**

- Replace direct `loadRequestFromPath` click call with new store action.
- If result is `requires-confirmation`, store pending target in sidebar state and show dialog.
- Hook dialog buttons to store follow-up actions (`confirmSaveAndOpen`, `confirmDiscardAndOpen`, cancel).

**Step 3: Verify behavior tests/manual checks**

```bash
cd frontend
yarn test
```

Expected: new interaction checks pass.

**Step 4: Commit**

```bash
git add frontend/src/components/collections/CollectionsSidebar.tsx frontend/src/store/tabs-store.ts
git commit -m "feat(frontend): add dirty-tab confirmation for collection request navigation"
```

---

### Task 4: Ensure tab/collection highlight consistency

**Files:**
- Modify: `frontend/src/components/request-builder/RequestTabs.tsx`
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx`
- Optional test updates: `frontend/src/components/request-builder/__tests__/...`

**Step 1: Add failing test/manual assertion**

- switching tabs should update collection context/highlight to active tab request path.

**Step 2: Implement consistency hooks**

- keep active collection/tree context synchronized when user activates request tabs.
- ensure collection click and tab click converge on same state.

**Step 3: Verify**

```bash
cd frontend
yarn test
```

Expected: all pass.

**Step 4: Commit**

```bash
git add frontend/src/components/request-builder/RequestTabs.tsx frontend/src/components/collections/CollectionsSidebar.tsx
git commit -m "fix(frontend): keep collection highlight in sync with active request tab"
```

---

### Task 5: Full verification and regression checks

**Files:**
- Optional docs note update: `docs/plans/2026-03-04-collections-postman-bruno-nav.md`

**Step 1: Run project checks**

```bash
cd frontend
yarn lint
yarn test
yarn build
cd ../backend
go test ./...
```

Expected: all pass.

**Step 2: Manual repro validation**

1. Open request A from tree.
2. Open request B from tree.
3. Click A again -> existing A tab focused (no duplicate tab).
4. Make unsaved change in active tab.
5. Click request C from tree -> Save/Discard/Cancel dialog appears.
6. Cancel -> stay on current tab unchanged.
7. Discard -> current tab replaced with C.
8. Save -> current tab saved then replaced with C.

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix(frontend): align collections navigation with Postman/Bruno behavior"
```

