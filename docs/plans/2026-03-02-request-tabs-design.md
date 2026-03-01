# Request Tabs Design

**Date**: 2026-03-02
**Status**: Approved

## Overview

Add a tabbed interface to the request builder so multiple requests can be open simultaneously, each with independent state.

## Data Model

Replace `useRequestStore` with a new `useTabsStore`. Each tab owns its complete state:

```typescript
interface Tab {
  id: string
  request: HttpRequest
  response: HttpResponse | null
  isDirty: boolean
  isLoading: boolean
  collectionName?: string  // set when loaded from a collection
  filePath?: string        // file path within collection
}

interface TabsState {
  tabs: Tab[]
  activeTabId: string

  newTab: () => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateActiveRequest: (updates: Partial<HttpRequest>) => void
  loadRequestInActiveTab: (request: HttpRequest, collectionName?: string, filePath?: string) => void
  setActiveTabResponse: (response: HttpResponse | null) => void
  setActiveTabLoading: (loading: boolean) => void
  markActiveTabSaved: () => void
  saveActiveTab: (collectionName: string, path?: string) => Promise<void>
  loadRequestFromPath: (collectionName: string, path: string) => Promise<void>
}
```

Initial state: one default "Untitled Request" tab.

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [GET] Untitled Request ●  ×  │ [POST] Login  ×  │ [+]       │
├─────────────────────────────────────────────────────────────┤
│                    RequestBuilder                            │
│                    (active tab content)                      │
└─────────────────────────────────────────────────────────────┘
```

### Tab appearance
- Colored method badge (existing color coding)
- Request name truncated at ~20 chars
- Dirty indicator dot `●` when `isDirty === true`
- `×` close button
- `+` button at the end for new tab
- Active tab: distinct background + bottom border

### Behaviors
- **Close dirty tab**: shadcn `AlertDialog` — "Discard changes to **[name]**?" with Cancel / Discard
- **Close last tab**: silently opens a fresh "Untitled Request" instead of leaving panel empty
- **Sidebar click**: replaces active tab's request; if active tab is dirty, shows discard dialog first

## File Changes

| File | Action |
|------|--------|
| `src/store/tabs-store.ts` | Create — replaces `useRequestStore` |
| `src/components/request-builder/RequestTabs.tsx` | Create — tab bar component |
| `src/store/request-store.ts` | Delete |
| `src/components/request-builder/RequestBuilder.tsx` | Update — use `useTabsStore` |
| `src/components/collections/CollectionsSidebar.tsx` | Update — call `loadRequestInActiveTab` |
| `src/App.tsx` | Update — render `<RequestTabs />` above `<RequestBuilder />` |
