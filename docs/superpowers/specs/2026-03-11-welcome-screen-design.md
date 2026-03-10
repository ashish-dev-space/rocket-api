# Welcome Screen Design

**Date:** 2026-03-11  
**Status:** Approved  
**Topic:** Empty/welcome screen shown when no tabs are open (Postman-style)

---

## Problem

The app currently auto-creates a blank `GET` request tab on first launch and whenever the last tab is closed. This means the user is never shown a true empty state — they always land in a blank `RequestBuilder` with no guidance or onboarding copy.

## Goal

Show a Postman-style welcome/empty screen:
- On first launch (no persisted tabs in `sessionStorage`)
- Whenever the user closes all open tabs

The screen replaces the auto-created blank tab entirely.

---

## Architecture

### Four touch-points, one new component

**1. `tabs-store.ts` — allow empty tabs array**

Two places currently prevent `tabs` from ever being empty:

- `closeTab`: when closing the last tab, creates a fresh default tab instead of allowing empty state. This guard is **removed** — closing the last tab sets `tabs = []` and `activeTabId = ''`.
- `normalizeSession`: when hydrating from `sessionStorage` with no stored tabs, calls `createInitialSession()` which creates a blank tab. This fallback is **changed** to return `{ tabs: [], activeTabId: '' }` instead.

All other tab operations are unchanged.

**2. `App.tsx` — conditional content area**

The content area currently renders:
```
activeTab && !isRequestTab(activeTab) → <CollectionOverview />
otherwise                             → <RequestBuilder />
```

A new branch is added:
```
tabs.length === 0                     → <WelcomeScreen />
activeTab && !isRequestTab(activeTab) → <CollectionOverview />
otherwise                             → <RequestBuilder />
```

**3. New `WelcomeScreen` component**

Path: `src/components/layout/WelcomeScreen.tsx`

Purely presentational. Sits alongside `ConsolePanel.tsx` and `GlobalStatusBar.tsx` in the `layout/` directory.

**4. `RequestTabs.tsx` — no change**

The tab bar already handles an empty tabs list gracefully (shows only the `+` button). No modification required.

---

## WelcomeScreen Component

### Visual layout

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│          🚀  (rocket.png, 96px)         │
│                                         │
│     Launch your first request           │  ← text-2xl font-semibold
│   Send your first HTTP request          │  ← text-sm text-muted-foreground
│   to get started.                       │
│                                         │
│        [ + New Request ]                │  ← shadcn Button, default variant
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Styling
- Takes up the full `flex-1` content area (fills the space left of sidebar, right of border)
- Background: transparent — inherits the app's gradient
- Rocket image: `rocket.png` at `96px`, `opacity-80`, with a subtle drop shadow
- Heading: `text-2xl font-semibold text-foreground`
- Sub-text: `text-sm text-muted-foreground`
- Button: shadcn `Button` (default variant), calls `useTabsStore().newTab()`

### Dependencies
- `rocket.png` — existing public asset, no new files needed
- `lucide-react` `Plus` icon — already installed
- `shadcn/ui` `Button` — already installed
- `useTabsStore` — existing store

---

## Data Flow

```
Close last tab
  → tabs-store: tabs = [], activeTabId = ''
  → App.tsx: tabs.length === 0
  → renders <WelcomeScreen />

User clicks "+ New Request"
  → newTab() called on tabs-store
  → tabs = [newTab], activeTabId = newTab.id
  → App.tsx: active request tab found
  → renders <RequestBuilder />
```

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| First launch, no stored tabs | `normalizeSession` returns `{ tabs: [], activeTabId: '' }` → welcome screen |
| App loads with stored tabs | Hydrated normally → existing tabs restored, welcome screen never shown |
| User closes all tabs one by one | Last `closeTab` → `tabs = []` → welcome screen |
| Click "New Request" on welcome screen | `newTab()` → welcome screen replaced by `RequestBuilder` |
| Click `+` in tab bar while on welcome screen | Same: `newTab()` already works |
| `sessionStorage` cleared or corrupted | Falls back to `{ tabs: [], activeTabId: '' }` → welcome screen |

---

## Testing

- **Unit — `tabs-store`:** closing the last tab should produce `tabs = []` (not a fresh tab)
- **Unit — `normalizeSession`:** called with `{ tabs: [] }` or undefined should return `{ tabs: [], activeTabId: '' }`
- **Component — `WelcomeScreen`:** renders heading, image, and button; button click invokes `newTab`
