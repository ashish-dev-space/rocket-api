# Tab Session And Selection Persistence Design

**Date:** 2026-03-05
**Status:** Approved

## Problem
Reloading Rocket clears selected request context. Current state is in-memory only for tabs/active tab selection, so request/collection context is lost after refresh.

## Goal
Restore the full session after reload (all open tabs + active tab) and re-select active collection/request in the sidebar tree, matching Postman/Bruno behavior.

## Non-Goals
- No backend session service.
- No cross-device sync.
- No persistence of runtime in-flight flags.

## Selected Approach
Use Zustand `persist` for tabs session and persist active collection identity in collections state. Rehydrate and then synchronize sidebar selection/tree loading from the active tab context.

## Architecture
- Persist tabs store (`tabs`, `activeTabId`) under a versioned localStorage key.
- Persist collections store active selection metadata needed for restore (`activeCollection` identity).
- Keep ephemeral runtime maps (e.g. async load versions) non-persistent.

## Reload Flow
1. Rehydrate tabs state from localStorage.
2. Rehydrate active collection identity.
3. Determine active tab:
   - If request tab with `collectionName` + `filePath`: set active collection, fetch tree, highlight request path.
   - If collection-overview tab: set active collection and keep overview tab active.
4. Expand parent folders so active request is visible.
5. Fallback safely if collection/request no longer exists.

## UX Expectations
- After reload, all previously open tabs return.
- Previously active tab is focused.
- Sidebar highlights corresponding request and collection.
- Behavior feels equivalent to Postman/Bruno session restore.

## Error Handling
- Missing/invalid persisted data: fallback to a single default tab.
- Missing collection/request on disk: keep tabs, fallback selection gracefully without crashes.

## Verification Criteria
1. Open multiple tabs (request + collection overview), reload, verify full tab session restores.
2. Active request tab on reload sets active collection and request highlight in sidebar tree.
3. Active collection-overview tab on reload restores active collection selection.
4. No regressions in tab switching, request loading, or save/dirty behavior.

