# Collections Navigation Postman/Bruno-Like Behavior Design

## Goal

Make collection-list request opening behavior align with Postman/Bruno expectations:

- focus already-open request tabs,
- reuse active clean tab,
- and prompt when active tab is dirty before replacing.

## Desired Behavior (Approved)

When user clicks a request in collection tree:

1. If same request is already open in any tab (`collectionName + filePath`), focus that tab.
2. Else if active tab is a clean request tab, reuse it.
3. Else if active tab is a dirty request tab, show `Save / Discard / Cancel`.
4. `Save` or `Discard` proceeds to load clicked request into that tab.
5. `Cancel` aborts navigation.

Additional:

- Avoid duplicate tabs from repeated collection clicks.
- Tree highlight should always follow active request tab path.

## Approaches Considered

### 1) Patch `loadRequestFromPath` policy (recommended)

Pros:
- Small, focused change with low regression risk.
- Uses existing tab state and save logic.

Cons:
- Requires careful confirm-dialog integration.

### 2) Sidebar-only navigation policy

Pros:
- UI behavior is explicit in one component.

Cons:
- Duplicates tab policy logic outside store.
- Higher chance of drift between components.

### 3) Full tab-manager refactor

Pros:
- Strong long-term architecture.

Cons:
- Overkill for current issue and slower delivery.

## Recommended Design

Use **store-centric navigation policy** with sidebar only handling dialog UX.

- Add one tab-opening decision action in `tabs-store`.
- Return structured outcomes (`focusedExisting`, `reusedActive`, `requiresConfirmation`, `loaded`).
- Sidebar renders Save/Discard/Cancel only when store signals confirmation needed.

## Architecture and Data Flow

### Store-level action

Introduce action (name can vary), e.g.:

- `openRequestFromCollection(collectionName, path)`

Flow:

1. Check open tabs for matching request by `collectionName + filePath`.
2. If found: set `activeTabId` to existing tab and return early.
3. If no existing tab:
   - If active tab is request + clean: load into active tab.
   - If active tab is request + dirty: return `requiresConfirmation` with tab info.
   - If active tab is non-request: create/select request tab and load.

### Sidebar integration

- On request click, call store action.
- If result says `requiresConfirmation`, open dialog and invoke follow-up action:
  - `confirmOpenWithSave` or `confirmOpenWithDiscard`.
- Keep sidebar selection visual only; save target must remain tab-scoped.

### Save target safety

- Save path must stay tied to captured tab id and tab filePath.
- Selection changes in sidebar must not alter save target.

## Error Handling

- If load fails after user confirms, keep current tab content unchanged and show existing error feedback.
- If save fails in `Save then open`, keep user on original tab and preserve dirty state.
- Prevent duplicated in-flight loads to same tab/path.

## Testing Strategy

Add tests for:

1. Click request already open -> focuses existing tab, no reload.
2. Click new request with clean active tab -> reuses active tab.
3. Click new request with dirty active tab -> requires confirmation result.
4. Confirm `Discard` -> loads clicked request into same tab.
5. Confirm `Save` -> saves current tab then loads clicked request.
6. Cancel confirmation -> no tab/context change.

Manual checks:

1. Open A, open B.
2. Click A in tree -> focuses A tab, no extra tab.
3. Edit A without saving, click C -> prompt appears.
4. Cancel keeps A unchanged.
5. Discard replaces A with C.

## Scope

In scope:
- request-click tab reuse/focus policy
- dirty-tab confirmation behavior
- active tab and tree-highlight consistency

Out of scope:
- broader tab UX redesign
- autosave architecture changes

