# Collection Sidebar Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all identified bugs in the CollectionsSidebar — from build-breaking type errors to UX and performance issues.

**Architecture:** Targeted fixes across the hook layer (`useCollections`), the sidebar component, and related selectors. No structural refactors — each task addresses one specific issue.

**Tech Stack:** React 19, TypeScript, Zustand 4.4.7, Vitest

---

## Task 1: Add missing `importBruno` to `useCollections` hook

**Files:**
- Modify: `src/features/collections/hooks/useCollections.ts:4-16`
- Modify: `src/features/collections/__tests__/collections-hooks.test.tsx:30-44`

- [ ] **Step 1: Add `importBruno` to the hook selector**

In `src/features/collections/hooks/useCollections.ts`, add `importBruno` to the returned object:

```typescript
import { useShallow } from 'zustand/react/shallow'
import { useCollectionsStore } from '@/store/collections'

export function useCollections() {
  return useCollectionsStore(useShallow(state => ({
    collections: state.collections,
    activeCollection: state.activeCollection,
    isCollectionsLoading: state.isCollectionsLoading,
    error: state.error,
    fetchCollections: state.fetchCollections,
    createCollection: state.createCollection,
    deleteCollection: state.deleteCollection,
    setActiveCollection: state.setActiveCollection,
    importBruno: state.importBruno,
    exportBruno: state.exportBruno,
    exportPostman: state.exportPostman,
  })))
}

export default useCollections
```

This also adds `useShallow` to fix the unnecessary re-render issue (review item #6).

- [ ] **Step 2: Add `importBruno` mock to the test store state**

In `src/features/collections/__tests__/collections-hooks.test.tsx`, add to `storeState` (after line 36):

```typescript
importBruno: vi.fn(),
```

- [ ] **Step 3: Verify build compiles**

Run: `yarn build 2>&1 | grep -E "importBruno|error TS"`
Expected: No `importBruno` errors remain.

- [ ] **Step 4: Run existing hook tests**

Run: `yarn vitest run src/features/collections/__tests__/collections-hooks.test.tsx`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/collections/hooks/useCollections.ts src/features/collections/__tests__/collections-hooks.test.tsx
git commit -m "fix(collections): add missing importBruno to useCollections hook

The hook was missing importBruno from its store projection, causing TS2339
errors in CollectionsSidebar and GlobalStatusBar. Also switches to
useShallow to prevent unnecessary re-renders."
```

---

## Task 2: Fix `new URL()` crash in history rendering

**Files:**
- Modify: `src/components/collections/CollectionsSidebar.tsx:748-755`

- [ ] **Step 1: Add safe URL parsing**

Replace lines 748-755 in `CollectionsSidebar.tsx`:

```typescript
// Before (crashes on relative/malformed URLs):
const urlObj = new URL(entry.url)
const path = urlObj.pathname + urlObj.search

// After:
let path = entry.url
let hostname = ''
try {
  const urlObj = new URL(entry.url)
  path = urlObj.pathname + urlObj.search
  hostname = urlObj.hostname
} catch {
  // Relative or malformed URL — display as-is.
}
```

And update the hostname reference at line 814 from `urlObj.hostname` to `hostname`.

- [ ] **Step 2: Verify build compiles**

Run: `yarn build 2>&1 | grep "CollectionsSidebar"`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/collections/CollectionsSidebar.tsx
git commit -m "fix(sidebar): prevent crash on relative/malformed URLs in history

new URL() throws on relative paths like /api/users. Wrap in try/catch
with fallback to display the raw URL string."
```

---

## Task 3: Fix collection click handler UX (separate expand from overview)

**Files:**
- Modify: `src/components/collections/CollectionsSidebar.tsx:617-623`

- [ ] **Step 1: Separate the click handler logic**

Replace the collection header `onClick` at lines 617-623. The chevron toggles expand/collapse. Clicking the name activates and opens overview only when expanding or switching collections:

```typescript
onClick={() => {
  const wasExpanded = expandedCollectionId === collection.id
  toggleCollection(collection.id)
  if (!wasExpanded) {
    setActiveCollection(collection)
    openCollectionOverview(collection.name)
  }
}}
```

This means: collapsing a collection just collapses it. Expanding a collection activates it and opens its overview.

- [ ] **Step 2: Manual verification**

Verify behavior:
1. Click collection A — it expands, overview opens.
2. Click collection A again — it collapses, no new tab opens.
3. Click collection B — it expands, overview opens for B.

- [ ] **Step 3: Commit**

```bash
git add src/components/collections/CollectionsSidebar.tsx
git commit -m "fix(sidebar): only open overview tab when expanding a collection

Previously, collapsing a collection also opened an overview tab."
```

---

## Task 4: Fix `toggleCollection` clearing folder state on re-expand

**Files:**
- Modify: `src/components/collections/CollectionsSidebar.tsx:206-209`

- [ ] **Step 1: Only clear folders when switching collections**

Replace `toggleCollection`:

```typescript
const toggleCollection = (id: string) => {
  setExpandedCollectionId(prev => {
    if (prev === id) return null
    // Switching to a different collection — clear folder state.
    setExpandedFolders(new Set())
    return id
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/collections/CollectionsSidebar.tsx
git commit -m "fix(sidebar): preserve folder expansion when re-expanding same collection

Only clear expandedFolders when switching to a different collection."
```

---

## Task 5: Fix `isCollectionsLoading` blocking history tab

**Files:**
- Modify: `src/components/collections/CollectionsSidebar.tsx:598-603`

- [ ] **Step 1: Scope loading spinner to collections tab only**

Replace lines 598-603:

```tsx
{/* Content */}
<div className="flex-1 overflow-auto">
  {activeTab === 'collections' ? (
    isCollectionsLoading ? (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ) : (
```

Move the loading check inside the collections branch so history tab renders independently.

- [ ] **Step 2: Commit**

```bash
git add src/components/collections/CollectionsSidebar.tsx
git commit -m "fix(sidebar): show history tab even when collections are loading

The isCollectionsLoading gate was blocking both tabs."
```

---

## Task 6: Fix `activeTabContext` selector performance

**Files:**
- Modify: `src/components/collections/CollectionsSidebar.tsx:1,124-135`

- [ ] **Step 1: Replace inline selector with `useShallow`**

Add import at the top of `CollectionsSidebar.tsx`:

```typescript
import { useShallow } from 'zustand/react/shallow'
```

Replace lines 124-135:

```typescript
const { collectionName: activeTabCollectionName, filePath: activeTabFilePath } =
  useTabsStore(useShallow(state => {
    const tab = state.tabs.find(t => t.id === state.activeTabId)
    if (!tab || tab.kind !== 'request') {
      return { collectionName: null, filePath: null }
    }
    return {
      collectionName: tab.collectionName ?? null,
      filePath: tab.filePath ?? null,
    }
  }))
```

Remove the now-unused lines 134-135 (`activeTabCollectionName` and `activeTabFilePath` variable declarations).

- [ ] **Step 2: Commit**

```bash
git add src/components/collections/CollectionsSidebar.tsx
git commit -m "perf(sidebar): use useShallow for activeTabContext selector

Prevents re-renders on every tabs-store update."
```

---

## Task 7: Fix double wrapper divs in history tab

**Files:**
- Modify: `src/components/collections/CollectionsSidebar.tsx:745-746,821-822`

- [ ] **Step 1: Merge the two nested divs**

Replace lines 745-746:
```tsx
<div className="space-y-0.5 p-1">
<div className="space-y-1 px-1.5 py-1.5">
```

With a single:
```tsx
<div className="space-y-1 px-1.5 py-1.5">
```

And remove one of the two closing `</div>` tags at lines 821-822, keeping only one.

- [ ] **Step 2: Commit**

```bash
git add src/components/collections/CollectionsSidebar.tsx
git commit -m "fix(sidebar): remove duplicate wrapper div in history list

Double nesting caused compounding padding."
```

---

## Task 8: Update search placeholder for clarity

**Files:**
- Modify: `src/components/collections/CollectionsSidebar.tsx:582`

- [ ] **Step 1: Update placeholder text**

Change:
```tsx
placeholder="Filter..."
```
To:
```tsx
placeholder="Filter collections..."
```

- [ ] **Step 2: Commit**

```bash
git add src/components/collections/CollectionsSidebar.tsx
git commit -m "fix(sidebar): clarify search placeholder only filters collection names"
```

---

## Task 9: Apply `useShallow` to remaining selector hooks

**Files:**
- Modify: `src/features/collections/hooks/useCollectionTree.ts`
- Modify: `src/features/collections/hooks/useCollectionSettings.ts`
- Modify: `src/features/history/hooks/useHistoryEntries.ts`

- [ ] **Step 1: Update `useCollectionSettings`**

```typescript
import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useCollectionsStore } from '@/store/collections'

export function useCollectionSettings(collectionName?: string) {
  const state = useCollectionsStore(useShallow(s => ({
    environments: s.environments,
    activeEnvironment: s.activeEnvironment,
    collectionVariables: s.collectionVariables,
    fetchEnvironments: s.fetchEnvironments,
    fetchEnvironmentDetail: s.fetchEnvironmentDetail,
    setActiveEnvironment: s.setActiveEnvironment,
    createEnvironment: s.createEnvironment,
    saveEnvironment: s.saveEnvironment,
    deleteEnvironment: s.deleteEnvironment,
    fetchCollectionVariables: s.fetchCollectionVariables,
    saveCollectionVariables: s.saveCollectionVariables,
  })))

  useEffect(() => {
    if (!collectionName) {
      return
    }

    state.fetchEnvironments(collectionName)
    state.fetchCollectionVariables(collectionName)
  }, [collectionName, state.fetchEnvironments, state.fetchCollectionVariables])

  return state
}

export default useCollectionSettings
```

- [ ] **Step 2: Update `useHistoryEntries`**

```typescript
import { useShallow } from 'zustand/react/shallow'
import { useHistoryStore } from '@/store/history'

export function useHistoryEntries() {
  return useHistoryStore(useShallow(state => ({
    entries: state.entries,
    isLoading: state.isLoading,
    error: state.error,
    selectedEntry: state.selectedEntry,
    fetchHistory: state.fetchHistory,
    selectEntry: state.selectEntry,
    deleteEntry: state.deleteEntry,
    clearHistory: state.clearHistory,
    loadEntryToBuilder: state.loadEntryToBuilder,
  })))
}

export default useHistoryEntries
```

- [ ] **Step 3: Run all tests**

Run: `yarn vitest run src/features/collections/__tests__/`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/collections/hooks/useCollectionSettings.ts \
       src/features/history/hooks/useHistoryEntries.ts
git commit -m "perf(hooks): add useShallow to collection and history selector hooks

Prevents unnecessary re-renders when unrelated store slices change."
```

---

## Task 10: Final build and lint verification

- [ ] **Step 1: Run full build**

Run: `yarn build`
Expected: Build succeeds (sidebar-related TS errors resolved).

- [ ] **Step 2: Run lint**

Run: `yarn lint`
Expected: No new lint errors.

- [ ] **Step 3: Run all tests**

Run: `yarn test`
Expected: All tests pass.
