# Collection Save & Request Name Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the save button creating duplicate files, and add an editable request name field that syncs to the tab bar.

**Architecture:** Two files change. `tabs-store.ts` gets the save path fix and `updateActiveName` action. `RequestBuilder.tsx` gets a `name` local state variable, a slim name input UI above the URL bar, and the name flushed before saving. No new files, no new dependencies.

**Tech Stack:** React 19, TypeScript, Zustand 4, Tailwind CSS v3, shadcn/ui (`Input` component already installed)

---

### Task 1: Fix `saveActiveTab` to use stored `filePath` and update it after save

**Files:**
- Modify: `frontend/src/store/tabs-store.ts:196-234`

**Context:**
`saveActiveTab` currently calls `apiService.saveRequest(collectionName, path, bruFile)` where `path` is always `undefined` (no caller passes it). The backend falls back to `name.bru`, creating a new file every time instead of updating the existing one. After saving, `markActiveTabSaved()` only clears `isDirty` — it never stores the saved `filePath` on the tab, so the second save also creates a new file.

**Step 1: Read the current function to confirm line numbers**

Open `frontend/src/store/tabs-store.ts`. The `saveActiveTab` function starts around line 196. Confirm these two lines:
```typescript
await apiService.saveRequest(collectionName, path, bruFile)  // line ~232
markActiveTabSaved()  // line ~233
```

**Step 2: Replace those two lines**

Replace:
```typescript
      const { apiService } = await import('@/lib/api')
      await apiService.saveRequest(collectionName, path, bruFile)
      markActiveTabSaved()
```

With:
```typescript
      const { apiService } = await import('@/lib/api')
      const effectivePath = path ?? activeTab.filePath
      const result = await apiService.saveRequest(collectionName, effectivePath, bruFile)
      set(state => ({
        tabs: state.tabs.map(t =>
          t.id === activeTabId
            ? { ...t, isDirty: false, filePath: result.path, collectionName }
            : t
        ),
      }))
```

Note: `markActiveTabSaved` is no longer called — its job (`isDirty: false`) is now done inline alongside updating `filePath` and `collectionName`. The `markActiveTabSaved` action itself can stay in the store (other code may call it), just remove it from `saveActiveTab`.

Also update the destructure at the top of `saveActiveTab` — remove `markActiveTabSaved` from the `get()` call since it's no longer used here:
```typescript
// Before:
const { tabs, activeTabId, markActiveTabSaved } = get()
// After:
const { tabs, activeTabId } = get()
```

**Step 3: Verify the build passes**

```bash
cd /home/numericlabs/data/rocket-api/frontend && npm run build
```
Expected: `✓ built` with no TypeScript errors.

**Step 4: Commit**

```bash
git add frontend/src/store/tabs-store.ts
git commit -m "fix(tabs): use stored filePath in saveActiveTab and update it after save"
```

---

### Task 2: Add `updateActiveName` action to the store

**Files:**
- Modify: `frontend/src/store/tabs-store.ts:30-48` (interface) and the `return {}` block

**Context:**
The `TabsState` interface lists all store actions. `updateActiveName` is missing alongside `updateActiveMethod`, `updateActiveUrl`, etc. Without it, editing the request name cannot be wired to the store.

**Step 1: Add to the `TabsState` interface**

Find this block (around line 30):
```typescript
  updateActiveMethod: (method: HttpMethod) => void
  updateActiveUrl: (url: string) => void
  updateActiveHeaders: (headers: Header[]) => void
  updateActiveQueryParams: (params: QueryParam[]) => void
  updateActiveBody: (body: RequestBody) => void
  updateActiveAuth: (auth: AuthConfig) => void
```

Add `updateActiveName` as the first entry:
```typescript
  updateActiveName: (name: string) => void
  updateActiveMethod: (method: HttpMethod) => void
  // ... rest unchanged
```

**Step 2: Add the implementation**

Find `updateActiveMethod` in the store's `return {}` block (around line 105):
```typescript
    updateActiveMethod: (method) =>
      set(state => ({
        tabs: state.tabs.map(t =>
          t.id === state.activeTabId
            ? { ...t, request: { ...t.request, method }, isDirty: true }
            : t
        ),
      })),
```

Add `updateActiveName` immediately before it:
```typescript
    updateActiveName: (name) =>
      set(state => ({
        tabs: state.tabs.map(t =>
          t.id === state.activeTabId
            ? { ...t, request: { ...t.request, name }, isDirty: true }
            : t
        ),
      })),

    updateActiveMethod: (method) =>
```

**Step 3: Verify the build passes**

```bash
cd /home/numericlabs/data/rocket-api/frontend && npm run build
```
Expected: `✓ built` with no TypeScript errors.

**Step 4: Commit**

```bash
git add frontend/src/store/tabs-store.ts
git commit -m "feat(tabs): add updateActiveName store action"
```

---

### Task 3: Add name local state, sync, and name flush in `RequestBuilder`

**Files:**
- Modify: `frontend/src/components/request-builder/RequestBuilder.tsx`

**Context:**
`RequestBuilder` has local state for `method`, `url`, `headers`, `queryParams`, `body`, `auth` — all synced from the store in a `useEffect`, all flushed to the store before save/send. The `name` field is absent from all three steps. This task adds it to all three.

**Step 1: Add `updateActiveName` to the store destructure**

Find the `useTabsStore()` destructure (around line 86):
```typescript
  const {
    tabs,
    activeTabId,
    updateActiveMethod,
    updateActiveUrl,
    ...
    saveActiveTab,
  } = useTabsStore()
```

Add `updateActiveName` as the first action:
```typescript
  const {
    tabs,
    activeTabId,
    updateActiveName,
    updateActiveMethod,
    updateActiveUrl,
    ...
    saveActiveTab,
  } = useTabsStore()
```

**Step 2: Add `name` local state**

Find the existing local state declarations (around line 110):
```typescript
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<Header[]>([])
  const [queryParams, setQueryParams] = useState<QueryParam[]>([])
  const [body, setBody] = useState<RequestBody>({ type: 'none', content: '' })
  const [auth, setAuth] = useState<AuthConfig>({ type: 'none' })
```

Add `name` as the first entry:
```typescript
  const [name, setName] = useState('Untitled Request')
  const [method, setMethod] = useState<HttpMethod>('GET')
  // ... rest unchanged
```

**Step 3: Add `name` to the sync effect**

Find the sync `useEffect` (around line 118):
```typescript
  useEffect(() => {
    if (currentRequest) {
      setMethod(currentRequest.method)
      setUrl(currentRequest.url)
      setHeaders(currentRequest.headers)
      setQueryParams(currentRequest.queryParams)
      setBody(currentRequest.body)
      setAuth(currentRequest.auth)
    }
  }, [currentRequest?.id, activeTabId])
```

Add `setName` as the first call inside:
```typescript
  useEffect(() => {
    if (currentRequest) {
      setName(currentRequest.name)
      setMethod(currentRequest.method)
      setUrl(currentRequest.url)
      setHeaders(currentRequest.headers)
      setQueryParams(currentRequest.queryParams)
      setBody(currentRequest.body)
      setAuth(currentRequest.auth)
    }
  }, [currentRequest?.id, activeTabId])
```

**Step 4: Add `updateActiveName(name)` to the `handleSaveRequest` flush block**

Find the flush block in `handleSaveRequest` (around line 139):
```typescript
    // Flush local edits into the store before saving.
    updateActiveMethod(method)
    updateActiveUrl(url)
    updateActiveHeaders(headers)
    updateActiveQueryParams(queryParams)
    updateActiveBody(body)
    updateActiveAuth(auth)

    await saveActiveTab(activeCollection.name)
```

Add `updateActiveName(name)` as the first flush:
```typescript
    // Flush local edits into the store before saving.
    updateActiveName(name)
    updateActiveMethod(method)
    updateActiveUrl(url)
    updateActiveHeaders(headers)
    updateActiveQueryParams(queryParams)
    updateActiveBody(body)
    updateActiveAuth(auth)

    await saveActiveTab(activeCollection.name)
```

Also add `name` and `updateActiveName` to the `useCallback` dependency array for `handleSaveRequest`. Find:
```typescript
  }, [activeCollection, method, url, headers, queryParams, body, auth, updateActiveMethod, updateActiveUrl, updateActiveHeaders, updateActiveQueryParams, updateActiveBody, updateActiveAuth, saveActiveTab])
```

Replace with:
```typescript
  }, [activeCollection, name, method, url, headers, queryParams, body, auth, updateActiveName, updateActiveMethod, updateActiveUrl, updateActiveHeaders, updateActiveQueryParams, updateActiveBody, updateActiveAuth, saveActiveTab])
```

**Step 5: Verify the build passes**

```bash
cd /home/numericlabs/data/rocket-api/frontend && npm run build
```
Expected: `✓ built` with no TypeScript errors.

**Step 6: Commit**

```bash
git add frontend/src/components/request-builder/RequestBuilder.tsx
git commit -m "feat(request-builder): add name local state, sync, and flush before save"
```

---

### Task 4: Add name input UI above the URL bar

**Files:**
- Modify: `frontend/src/components/request-builder/RequestBuilder.tsx:367-369` (the URL bar wrapper div)

**Context:**
The URL bar is inside `<div className="p-4 border-b border-border bg-muted/40 shadow-sm">`. The name input goes inside this same div, above the `<TooltipProvider>` / `<form>` row. It uses the existing shadcn `Input` component (already imported).

**Step 1: Locate the URL bar wrapper**

Find this exact block (around line 367):
```tsx
        {/* URL Bar - Enhanced Style */}
        <div className="p-4 border-b border-border bg-muted/40 shadow-sm">
          <TooltipProvider>
            <form onSubmit={handleSubmit} className="flex gap-3">
```

**Step 2: Add the name input before `<TooltipProvider>`**

Replace the opening of that block with:
```tsx
        {/* URL Bar - Enhanced Style */}
        <div className="px-4 pt-2 pb-4 border-b border-border bg-muted/40 shadow-sm space-y-2">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              updateActiveName(e.target.value)
            }}
            placeholder="Untitled Request"
            className="h-7 text-sm font-medium border-0 border-b border-transparent hover:border-border focus:border-primary rounded-none bg-transparent px-0 focus-visible:ring-0 shadow-none"
          />
          <TooltipProvider>
            <form onSubmit={handleSubmit} className="flex gap-3">
```

Note: The outer div's padding changes from `p-4` to `px-4 pt-2 pb-4` to give the name input tighter top spacing. `space-y-2` adds the gap between name input and URL row.

**Step 3: Verify the build passes**

```bash
cd /home/numericlabs/data/rocket-api/frontend && npm run build
```
Expected: `✓ built` with no TypeScript errors.

**Step 4: Visual check**

Start the dev server and confirm:
- The name input appears above the method/URL row
- Typing in the name input updates the tab label in real time
- Clicking a request in the sidebar updates both the name input and the tab label
- The name has no visible border at rest, a subtle border on hover, and a colored border on focus
- The tab label shows the new name after saving

```bash
cd /home/numericlabs/data/rocket-api/frontend && npm run dev
```

**Step 5: Commit**

```bash
git add frontend/src/components/request-builder/RequestBuilder.tsx
git commit -m "feat(request-builder): add editable name input above URL bar"
```
