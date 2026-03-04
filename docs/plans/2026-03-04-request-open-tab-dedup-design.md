# Request Open Behavior Design (Postman/Bruno Parity)

## Context
Current behavior reuses the active request tab when opening a different request from the collections sidebar. This blocks a core workflow: opening two different requests from the same collection in two different tabs.

## Problem
When a user clicks request A and then request B (same collection, different file paths), request B replaces request A in the same active tab.

Expected behavior:
- Different requests should open in different tabs.
- Same request should not duplicate; it should focus the already-open tab.

## Goals
- Enable opening multiple requests from the same collection in separate tabs.
- Deduplicate only exact request identity.
- Keep sidebar/tab synchronization behavior intact.
- Avoid race conditions when rapidly opening requests.

## Non-Goals
- Changing close-tab UX.
- Introducing settings/toggles for tab open policy.
- Changing collection overview tab behavior.

## Behavior Contract
For sidebar request click (`collectionName`, `path`):
1. If a request tab already exists with the same `collectionName` and `filePath`, focus that tab and stop.
2. Otherwise create a brand-new request tab and load that request into the new tab.
3. Never reuse a different active request tab for a non-matching request.

This applies even when the current active request tab is clean, dirty, or loading.

## Technical Design

### Tabs Store
File: `frontend/src/store/tabs-store.ts`

- Update `loadRequestFromPath(collectionName, path)`:
  - Keep existing open-tab lookup by `(collectionName, filePath)`.
  - On miss, always create a new request tab and set it active.
  - Load the fetched request into that specific tab id.

- Add per-tab request-load guarding:
  - Maintain a per-tab load version/token map.
  - Apply async response only if token is still current for that tab.
  - Prevent stale responses from overwriting newer loads.

### Sidebar / Tabs UI
- No functional contract changes required in `RequestTabs`.
- Existing tab activation flow should continue to synchronize collection context.
- Existing sidebar expansion/highlight logic remains source of truth for visual selection.

## Edge Cases
- Same request clicked repeatedly:
  - First click opens it.
  - Subsequent clicks focus existing tab.
- Two different requests in same collection:
  - Two separate tabs are created.
- Dirty active tab:
  - Opening a different request does not overwrite dirty content.
- Rapid sequential clicks:
  - Each non-open request gets its own target tab.
  - Stale async results do not mutate unrelated tabs.

## Testing Strategy
- Add/update store tests to cover:
  - new tab on non-open request
  - focus existing tab on already-open request
  - no reuse of dirty active tab for different request
  - stale async load does not overwrite later request/tab state

- Run verification:
  - `yarn -s lint`
  - targeted tests for tabs store behavior

## Acceptance Criteria
- With one collection containing two requests, opening both from sidebar results in two distinct request tabs.
- Clicking either request again focuses its existing tab.
- Switching tabs keeps sidebar correctly aligned to active request selection.
