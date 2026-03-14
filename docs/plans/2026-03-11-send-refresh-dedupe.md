# Send Refresh Dedupe Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce duplicate local backend requests triggered by one `Send` action by trimming overlapping refresh effects and deduping identical in-flight store reads.

**Architecture:** Keep the send flow in the request builder responsible for send-side updates, remove the worst duplicate collection/history refresh effects from mounted components, and add keyed in-flight request coalescing in the collections and history stores. Verify the change with targeted Vitest regression tests that assert concurrent identical reads only hit the API once.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, Vite

---

### Task 1: Add collection-store dedupe regression tests

**Files:**
- Modify: `frontend/src/store/__tests__/collections-store.fetch-dedupe.test.ts`
- Check: `frontend/src/store/collections.ts`

**Step 1: Write the failing tests**

Extend `frontend/src/store/__tests__/collections-store.fetch-dedupe.test.ts` to cover:

- `fetchCollectionTree('snehal')` called twice concurrently
- `fetchEnvironments('snehal')` called twice concurrently
- `fetchCollectionVariables('snehal')` called twice concurrently

Mock the exact API methods used by the store:

```ts
const getCollectionMock = vi.fn()
const getEnvironmentsMock = vi.fn()
const getEnvironmentMock = vi.fn()
const getCollectionVariablesMock = vi.fn()

vi.mock('@/lib/api', () => ({
  apiService: {
    getCollections: getCollectionsMock,
    getCollection: getCollectionMock,
    getEnvironments: getEnvironmentsMock,
    getEnvironment: getEnvironmentMock,
    getCollectionVariables: getCollectionVariablesMock,
  },
}))
```

Use the same deferred-promise pattern already present in the file:

```ts
const pending = deferred<{ name: string; type: 'collection'; children: [] }>()
getCollectionMock.mockReturnValue(pending.promise)

const useCollectionsStore = await loadStore()
const p1 = useCollectionsStore.getState().fetchCollectionTree('snehal')
const p2 = useCollectionsStore.getState().fetchCollectionTree('snehal')

expect(getCollectionMock).toHaveBeenCalledTimes(1)
```

For environments, also assert the nested environment detail fetches are not duplicated:

```ts
getEnvironmentsMock.mockResolvedValue(['dev', 'qa'])
getEnvironmentMock
  .mockResolvedValueOnce({ id: '1', name: 'dev', variables: [] })
  .mockResolvedValueOnce({ id: '2', name: 'qa', variables: [] })

await Promise.all([
  useCollectionsStore.getState().fetchEnvironments('snehal'),
  useCollectionsStore.getState().fetchEnvironments('snehal'),
])

expect(getEnvironmentsMock).toHaveBeenCalledTimes(1)
expect(getEnvironmentMock).toHaveBeenCalledTimes(2)
```

**Step 2: Run tests to verify they fail**

Run:

```bash
cd frontend && yarn test src/store/__tests__/collections-store.fetch-dedupe.test.ts
```

Expected: FAIL because only `fetchCollections` currently dedupes in-flight requests.

**Step 3: Write the minimal implementation**

In `frontend/src/store/collections.ts`, add keyed in-flight maps near the
existing `fetchCollectionsInFlight` variable:

```ts
const fetchCollectionTreeInFlight = new Map<string, Promise<CollectionNode>>()
const fetchEnvironmentsInFlight = new Map<string, Promise<Environment[]>>()
const fetchCollectionVariablesInFlight = new Map<string, Promise<CollectionVar[]>>()
```

Update each store action to:

- return the in-flight promise if one exists for the same key
- create one promise for the read
- update store state from that promise
- clear the map entry in `finally`

For `fetchEnvironments`, dedupe the whole collection fetch, including the
fan-out to `getEnvironment`.

**Step 4: Run tests to verify they pass**

Run:

```bash
cd frontend && yarn test src/store/__tests__/collections-store.fetch-dedupe.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/store/__tests__/collections-store.fetch-dedupe.test.ts frontend/src/store/collections.ts
git commit -m "test(store): cover collection fetch dedupe"
```

### Task 2: Add history-store dedupe regression test

**Files:**
- Create: `frontend/src/store/__tests__/history-store.fetch-dedupe.test.ts`
- Modify: `frontend/src/store/history.ts`

**Step 1: Write the failing test**

Create `frontend/src/store/__tests__/history-store.fetch-dedupe.test.ts`
using the same deferred pattern and module-reset loading style:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getHistoryMock = vi.fn()

vi.mock('@/lib/api', () => ({
  apiService: {
    getHistory: getHistoryMock,
  },
}))

async function loadStore() {
  vi.resetModules()
  const mod = await import('@/store/history')
  return mod.useHistoryStore
}
```

Write a test for concurrent identical requests:

```ts
it('coalesces concurrent fetchHistory calls with the same limit', async () => {
  const pending = deferred([{ id: '1', method: 'GET', url: 'https://api.example.com', status: 200 }])
  getHistoryMock.mockReturnValue(pending.promise)

  const useHistoryStore = await loadStore()
  const p1 = useHistoryStore.getState().fetchHistory(50)
  const p2 = useHistoryStore.getState().fetchHistory(50)

  expect(getHistoryMock).toHaveBeenCalledTimes(1)

  pending.resolve([{ id: '1', method: 'GET', url: 'https://api.example.com', status: 200 }])
  await Promise.all([p1, p2])
})
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && yarn test src/store/__tests__/history-store.fetch-dedupe.test.ts
```

Expected: FAIL because `fetchHistory` currently starts a fresh request every time.

**Step 3: Write the minimal implementation**

In `frontend/src/store/history.ts`, add:

```ts
const fetchHistoryInFlight = new Map<number, Promise<HistoryEntry[]>>()
```

Refactor `fetchHistory(limit = 50)` to:

- reuse the existing promise for the same `limit`
- set loading/error state once per shared request
- update `entries` from the resolved result
- clear the in-flight entry in `finally`

**Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && yarn test src/store/__tests__/history-store.fetch-dedupe.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/store/__tests__/history-store.fetch-dedupe.test.ts frontend/src/store/history.ts
git commit -m "test(store): cover history fetch dedupe"
```

### Task 3: Remove overlapping refresh effects

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/collections/CollectionOverview.tsx`
- Check: `frontend/src/components/collections/CollectionsSidebar.tsx`
- Check: `frontend/src/components/request-builder/useRequestBuilderState.ts`

**Step 1: Write the failing behavior check**

Add or update a component-level regression test only if there is already a
stable test harness for these mounted effects. If setting up that harness
would exceed the value of the check, keep this task verified manually and
cover the safety net at the store level instead.

If a test is added, it should assert that rendering the relevant component
path does not trigger duplicate `fetchCollectionTree` or `fetchHistory`
calls for the same collection.

**Step 2: Inspect the current duplicate-effect owners**

Confirm these behaviors before editing:

- `App.tsx` refetches collection tree when active tab and active collection
  already point at the same collection.
- `CollectionOverview.tsx` unconditionally fetches collection tree on mount.
- `CollectionOverview.tsx` unconditionally fetches history on mount.
- `CollectionsSidebar.tsx` already fetches the active collection tree when
  `activeCollection` changes.

Run:

```bash
sed -n '1,220p' frontend/src/App.tsx
sed -n '1,220p' frontend/src/components/collections/CollectionOverview.tsx
sed -n '1,220p' frontend/src/components/collections/CollectionsSidebar.tsx
```

Expected: overlapping refresh ownership is visible in `useEffect` hooks.

**Step 3: Write the minimal implementation**

Change the components so only one path owns collection tree refresh:

- In `frontend/src/App.tsx`, keep active collection restoration from the
  active tab, but stop calling `fetchCollectionTree()` from that effect.
- In `frontend/src/components/collections/CollectionOverview.tsx`, remove
  the unconditional tree fetch on mount if the sidebar/store path already
  owns it.
- In `frontend/src/components/collections/CollectionOverview.tsx`, remove
  the unconditional `fetchHistory(10)` effect unless the overview page is
  the only place that needs that specific data and it is not already being
  refreshed elsewhere.

The end state should leave one clear owner for active collection tree
loading. Prefer the existing `CollectionsSidebar` ownership unless code
inspection during implementation shows the store should own it instead.

**Step 4: Run focused tests**

Run:

```bash
cd frontend && yarn test src/store/__tests__/collections-store.fetch-dedupe.test.ts src/store/__tests__/history-store.fetch-dedupe.test.ts
cd frontend && yarn lint
```

Expected: PASS.

**Step 5: Manual verification**

Run the app and repeat the exact send flow that previously produced the
request burst.

Run:

```bash
cd backend && go run cmd/server/main.go
cd frontend && yarn dev
```

Expected in browser devtools network panel:

- one `GET /health`
- one `POST /api/v1/requests/send`
- one `GET /api/v1/history?limit=50`
- no repeated burst of identical `collections`, `collections/:name`,
  `environments`, or `variables` requests

**Step 6: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/collections/CollectionOverview.tsx
git commit -m "fix(frontend): reduce duplicate refresh effects"
```

### Task 4: Final verification and wrap-up

**Files:**
- Check: `frontend/src/store/collections.ts`
- Check: `frontend/src/store/history.ts`
- Check: `frontend/src/App.tsx`
- Check: `frontend/src/components/collections/CollectionOverview.tsx`
- Check: `frontend/src/store/__tests__/collections-store.fetch-dedupe.test.ts`
- Check: `frontend/src/store/__tests__/history-store.fetch-dedupe.test.ts`

**Step 1: Run the targeted frontend test suite**

Run:

```bash
cd frontend && yarn test src/store/__tests__/collections-store.fetch-dedupe.test.ts src/store/__tests__/history-store.fetch-dedupe.test.ts
```

Expected: PASS.

**Step 2: Run lint**

Run:

```bash
cd frontend && yarn lint
```

Expected: PASS.

**Step 3: Review final diff**

Run:

```bash
git diff --stat HEAD~3..HEAD
git diff -- frontend/src/store/collections.ts frontend/src/store/history.ts frontend/src/App.tsx frontend/src/components/collections/CollectionOverview.tsx frontend/src/store/__tests__/collections-store.fetch-dedupe.test.ts frontend/src/store/__tests__/history-store.fetch-dedupe.test.ts
```

Expected: only dedupe guards, effect cleanup, and regression tests are present.

**Step 4: Final commit if needed**

If any verification fixes were required:

```bash
git add frontend/src/store/collections.ts frontend/src/store/history.ts frontend/src/App.tsx frontend/src/components/collections/CollectionOverview.tsx frontend/src/store/__tests__/collections-store.fetch-dedupe.test.ts frontend/src/store/__tests__/history-store.fetch-dedupe.test.ts
git commit -m "fix(frontend): dedupe send refresh reads"
```
