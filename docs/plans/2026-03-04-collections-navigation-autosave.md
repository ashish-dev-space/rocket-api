# Collections Navigation Autosave Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add debounced autosave for request edits so users can switch requests instantly without losing work.

**Architecture:** Keep autosave orchestration in `tabs-store` with per-request save metadata (`saveState`, snapshots, debounce timers, single-flight queue). RequestBuilder continues to edit local form state but pushes changes into the active request tab through a debounced sync. Sidebar navigation remains non-blocking; save operations continue per request ID in the background.

**Tech Stack:** React 19, TypeScript, Zustand store (`tabs-store`), existing `apiService.saveRequest`, Vitest + Testing Library for frontend behavior tests.

---

## Background reading

Before implementation, read:

- `frontend/src/store/tabs-store.ts` (active tab state, `saveActiveTab`, `loadRequestFromPath`)
- `frontend/src/components/request-builder/RequestBuilder.tsx` (local edit state + save/send flows)
- `frontend/src/components/collections/CollectionsSidebar.tsx` (request switching trigger)
- `frontend/src/lib/api.ts` (`saveRequest` contract)

---

### Task 1: Add frontend test tooling for store/component behavior

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`

**Step 1: Write failing test command expectation**

Run: `cd frontend && yarn vitest run`
Expected: FAIL because Vitest is not configured.

**Step 2: Add minimal test tooling**

- Add dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- Add scripts:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
- Add `vitest.config.ts` with jsdom env and setup file.
- Add `src/test/setup.ts` importing `@testing-library/jest-dom` and resetting mocks after each test.

**Step 3: Verify tooling works**

Run: `cd frontend && yarn test`
Expected: PASS with 0 tests (or PASS once later tasks add tests).

**Step 4: Commit**

```bash
git add frontend/package.json frontend/vitest.config.ts frontend/src/test/setup.ts
git commit -m "test(frontend): add vitest test harness"
```

---

### Task 2: Define autosave state model in `tabs-store`

**Files:**
- Modify: `frontend/src/store/tabs-store.ts`
- Test: `frontend/src/store/__tests__/tabs-store.autosave-state.test.ts`

**Step 1: Write failing test for state transitions**

Create test asserting a request tab transitions:

- initial -> `clean`
- edit -> `dirty`
- save start -> `saving`
- save fail -> `save_failed`
- retry success -> `clean`

Run: `cd frontend && yarn test frontend/src/store/__tests__/tabs-store.autosave-state.test.ts`
Expected: FAIL because autosave state fields/actions do not exist.

**Step 2: Implement minimal state shape**

In `RequestTab`, add:

- `saveState: 'clean' | 'dirty' | 'saving' | 'save_failed'`
- `lastSaveError?: string`
- `lastSavedSnapshot?: string`
- `pendingSnapshot?: string`
- `isSaveQueued?: boolean`

Initialize these in `createTab` and `loadRequestInActiveTab`.

Add helpers:

- `serializeRequestForSave(request: HttpRequest): string`
- `markActiveTabDirtyFromRequestUpdate()`

**Step 3: Re-run targeted test**

Run: `cd frontend && yarn test frontend/src/store/__tests__/tabs-store.autosave-state.test.ts`
Expected: PASS.

**Step 4: Commit**

```bash
git add frontend/src/store/tabs-store.ts frontend/src/store/__tests__/tabs-store.autosave-state.test.ts
git commit -m "feat(frontend): add request tab autosave state model"
```

---

### Task 3: Implement debounced autosave scheduler with single-flight queue

**Files:**
- Modify: `frontend/src/store/tabs-store.ts`
- Test: `frontend/src/store/__tests__/tabs-store.autosave-scheduler.test.ts`

**Step 1: Write failing scheduler tests**

Add tests for:

- multiple edits within debounce window trigger one save call
- while one save is in-flight, newer edit is queued and saved after completion
- failed save sets `save_failed` and retains draft snapshot

Mock `apiService.saveRequest`.

Run: `cd frontend && yarn test frontend/src/store/__tests__/tabs-store.autosave-scheduler.test.ts`
Expected: FAIL.

**Step 2: Implement autosave actions**

Add store actions:

- `scheduleActiveTabAutosave(collectionName: string): void`
- `flushTabAutosave(tabId: string): Promise<void>`
- `retryTabAutosave(tabId: string): Promise<void>`

Implementation constraints:

- Debounce at ~700ms.
- One in-flight save per tab/request.
- If edits occur during in-flight save, queue only latest snapshot.
- Reuse existing `apiService.saveRequest` payload mapping.

**Step 3: Verify tests pass**

Run: `cd frontend && yarn test frontend/src/store/__tests__/tabs-store.autosave-scheduler.test.ts`
Expected: PASS.

**Step 4: Commit**

```bash
git add frontend/src/store/tabs-store.ts frontend/src/store/__tests__/tabs-store.autosave-scheduler.test.ts
git commit -m "feat(frontend): add debounced autosave scheduler for request tabs"
```

---

### Task 4: Wire RequestBuilder edits into autosave pipeline

**Files:**
- Modify: `frontend/src/components/request-builder/RequestBuilder.tsx`
- Test: `frontend/src/components/request-builder/__tests__/RequestBuilder.autosave-sync.test.tsx`

**Step 1: Write failing integration test**

Test scenario:

- user edits URL/header/body fields
- store update actions are called
- autosave scheduler is triggered (debounced)

Use fake timers to advance debounce.

Run: `cd frontend && yarn test frontend/src/components/request-builder/__tests__/RequestBuilder.autosave-sync.test.tsx`
Expected: FAIL because no edit-to-autosave synchronization exists.

**Step 2: Implement minimal sync behavior**

In `RequestBuilder`:

- Add `useEffect` debounced sync that pushes local `name/method/url/headers/queryParams/body/auth` to active request tab via `updateActive*` actions.
- Call `scheduleActiveTabAutosave(activeCollection.name)` when synced edits differ from current store snapshot.
- Keep manual `Ctrl/Cmd+S` as explicit immediate save (`flushTabAutosave` / existing `saveActiveTab`).

**Step 3: Verify target test passes**

Run: `cd frontend && yarn test frontend/src/components/request-builder/__tests__/RequestBuilder.autosave-sync.test.tsx`
Expected: PASS.

**Step 4: Commit**

```bash
git add frontend/src/components/request-builder/RequestBuilder.tsx frontend/src/components/request-builder/__tests__/RequestBuilder.autosave-sync.test.tsx
git commit -m "feat(frontend): sync request editor changes to debounced autosave"
```

---

### Task 5: Add save-status UI and retry affordance

**Files:**
- Modify: `frontend/src/components/request-builder/RequestBuilder.tsx`
- Test: `frontend/src/components/request-builder/__tests__/RequestBuilder.save-status.test.tsx`

**Step 1: Write failing UI test**

Test visible status label in header for:

- `clean` => `Saved`
- `saving` => `Saving...`
- `save_failed` => `Failed to save`

Optional: test retry button appears on `save_failed` and calls `retryTabAutosave`.

Run: `cd frontend && yarn test frontend/src/components/request-builder/__tests__/RequestBuilder.save-status.test.tsx`
Expected: FAIL.

**Step 2: Implement status UI**

- Read `saveState` and `lastSaveError` from active request tab.
- Render compact indicator near save/send controls.
- On failure, include retry control.

**Step 3: Verify test passes**

Run: `cd frontend && yarn test frontend/src/components/request-builder/__tests__/RequestBuilder.save-status.test.tsx`
Expected: PASS.

**Step 4: Commit**

```bash
git add frontend/src/components/request-builder/RequestBuilder.tsx frontend/src/components/request-builder/__tests__/RequestBuilder.save-status.test.tsx
git commit -m "feat(frontend): show autosave status and retry action"
```

---

### Task 6: Ensure request switching is non-blocking and preserves background saves

**Files:**
- Modify: `frontend/src/store/tabs-store.ts`
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx` (only if needed)
- Test: `frontend/src/store/__tests__/tabs-store.navigation-autosave.test.ts`

**Step 1: Write failing test for navigation behavior**

Test scenario:

- tab A dirty and saving
- user loads request in tab B
- tab switch succeeds immediately
- tab A save completes and state becomes clean without tab focus requirement

Run: `cd frontend && yarn test frontend/src/store/__tests__/tabs-store.navigation-autosave.test.ts`
Expected: FAIL.

**Step 2: Implement behavior**

- Decouple autosave lifecycle from `activeTabId` reads during async completion.
- Always resolve save updates by stable `tabId` captured at schedule/flush time.
- Keep existing request loading UX unchanged (no modal blocks).

**Step 3: Verify test passes**

Run: `cd frontend && yarn test frontend/src/store/__tests__/tabs-store.navigation-autosave.test.ts`
Expected: PASS.

**Step 4: Commit**

```bash
git add frontend/src/store/tabs-store.ts frontend/src/components/collections/CollectionsSidebar.tsx frontend/src/store/__tests__/tabs-store.navigation-autosave.test.ts
git commit -m "fix(frontend): keep autosave running across request navigation"
```

---

### Task 7: Full verification and cleanup

**Files:**
- Modify: `docs/plans/2026-03-04-collections-navigation-autosave.md` (checklist updates only, optional)

**Step 1: Run full frontend verification**

```bash
cd frontend
yarn lint
yarn test
yarn build
```

Expected:
- Lint passes
- All tests pass
- Build succeeds

**Step 2: Manual smoke test**

Run app and verify:

1. Edit request content continuously; observe `Saving...` then `Saved`.
2. Switch to another request during save; no prompt appears.
3. Return to original request; edits remain persisted.
4. Simulate save failure (stop backend); verify `Failed to save` and retry path.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(frontend): complete request autosave workflow for collection navigation"
```

