# Tab Session And Selection Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist and restore full tab session (all tabs + active tab) and synchronize active collection/request selection in sidebar after reload.

**Architecture:** Add Zustand `persist` to tabs store and persist active collection identity in collections store. On app bootstrap/rehydration, align collection tree and request highlight with the active tab context.

**Tech Stack:** React, Zustand, TypeScript, Vitest.

---

### Task 1: Add failing tests for tab store session persistence

**Files:**
- Modify: `frontend/src/store/__tests__/tabs-store.save-target-and-dirty.test.ts` (or create dedicated persistence test file)

**Step 1: Write failing test for restoring tabs + activeTabId**
- Seed persisted store payload in localStorage.
- Recreate store module instance.
- Assert all tabs and `activeTabId` restored.

**Step 2: Write failing fallback test for invalid persisted state**
- Persist payload with missing active tab id or empty tabs.
- Assert store falls back to valid default tab/active selection.

**Step 3: Run test to verify RED state**
Run: `yarn -s test src/store/__tests__/tabs-store.save-target-and-dirty.test.ts --run`
Expected: FAIL until persist logic is added.

**Step 4: Commit failing tests**
```bash
git add frontend/src/store/__tests__/tabs-store.save-target-and-dirty.test.ts
git commit -m "test(frontend): add failing tab session persistence coverage"
```

### Task 2: Implement tabs-store persistence with safe hydration

**Files:**
- Modify: `frontend/src/store/tabs-store.ts`

**Step 1: Add Zustand `persist` middleware**
- Persist `tabs` and `activeTabId` under versioned key (`rocket-api:tabs-session:v1`).

**Step 2: Add hydration guards**
- Ensure at least one tab exists post-hydration.
- Ensure `activeTabId` references an existing tab; fallback to first/default.

**Step 3: Keep non-persistent runtime state ephemeral**
- Do not persist async version maps or transient loading internals beyond tab state itself.

**Step 4: Run store tests**
Run: `yarn -s test src/store/__tests__/tabs-store.save-target-and-dirty.test.ts --run`
Expected: PASS.

**Step 5: Commit implementation**
```bash
git add frontend/src/store/tabs-store.ts frontend/src/store/__tests__/tabs-store.save-target-and-dirty.test.ts
git commit -m "feat(frontend): persist and restore tab session with safe hydration"
```

### Task 3: Persist active collection selection and synchronize reload selection

**Files:**
- Modify: `frontend/src/store/collections.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx` (if needed for reselect hook)

**Step 1: Persist active collection identity**
- Store/retrieve active collection name/id to localStorage (or zustand persist partial state).

**Step 2: On app load, sync collection from active tab context**
- If active tab is request tab with `collectionName`/`filePath`, set active collection and fetch tree.
- Ensure request path highlighting/expansion path sync occurs once tree is loaded.

**Step 3: Handle collection-overview tabs**
- If active tab is collection-overview, set that collection active.

**Step 4: Add/adjust tests for reload sync behavior**
- Validate active collection and request highlight derive from rehydrated active tab context.

**Step 5: Run targeted frontend tests and typecheck**
Run:
- `yarn -s test src/components/collections --run`
- `yarn -s test src/store/__tests__/tabs-store.save-target-and-dirty.test.ts --run`
- `yarn -s tsc --noEmit`
Expected: PASS.

**Step 6: Commit selection-sync changes**
```bash
git add frontend/src/store/collections.ts frontend/src/App.tsx frontend/src/components/collections/CollectionsSidebar.tsx
git commit -m "fix(frontend): restore active collection and request selection after reload"
```

### Task 4: Full verification

**Files:**
- No new files required

**Step 1: Run broader frontend verification**
Run:
- `yarn -s test src/store --run`
- `yarn -s test src/components/request-builder --run`
- `yarn -s test src/components/collections --run`
Expected: PASS.

**Step 2: Manual acceptance check**
- Open 2-3 tabs, include request tab and collection-overview tab.
- Select specific request in sidebar.
- Reload app.
- Confirm all tabs restore, active tab restores, active collection restores, request remains highlighted.

**Step 3: Capture final status**
Run:
- `git status --short`
- `git log --oneline -n 8`

