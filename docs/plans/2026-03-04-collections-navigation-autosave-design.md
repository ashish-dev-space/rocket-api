# Collections Navigation Autosave Design

## Goal

Improve collections/navigation workflow so switching requests never interrupts the user, while preserving unsaved edits through debounced autosave.

## Problem

Current request switching can risk losing in-progress edits or force the user into interruption-heavy confirmation flows. The target workflow is uninterrupted navigation with automatic persistence.

## Approaches Considered

### 1. Debounced autosave in frontend store (recommended)

- Keep autosave in store/state layer.
- Mark draft dirty on edit and debounce save calls.
- Switch requests immediately with no prompts.

Pros:
- Smoothest UX and low cognitive overhead.
- Moderate implementation cost.
- Reuses existing save APIs.

Cons:
- Needs careful dirty/saving/error state handling.

### 2. Save on every keystroke

Pros:
- Simple model; always up to date.

Cons:
- Excessive network writes.
- Higher chance of lag and noisy failure states.

### 3. Local draft cache plus periodic flush

Pros:
- Better resilience during transient API failures.

Cons:
- More complexity and reconciliation logic.

## Recommended Approach

Use debounced autosave in the frontend store with per-request save lifecycle metadata and non-blocking navigation.

## Design

### 1. Behavior and UX

- Track request edit state as `clean`, `dirty`, `saving`, `save_failed`.
- Any edit marks request `dirty` and schedules save with debounce (target 600-800ms).
- Switching requests should be immediate with no confirmation modal.
- In-flight save continues in background even after switching tabs/requests.
- Request builder header shows status: `Saved`, `Saving...`, or `Failed to save`.
- On failure, keep the in-memory draft and retry on next edit (or manual retry).

### 2. Architecture and data flow

- Place autosave orchestration in store layer (tabs/collections state), not in visual components.
- Maintain per-request metadata:
  - `lastSavedSnapshot`
  - `pendingSnapshot`
  - `saveState`
  - `lastError`
  - `debounceTimerId`
- Edit flow:
  1. User edits request fields.
  2. Store updates draft and compares against `lastSavedSnapshot`.
  3. If changed, mark `dirty` and reset debounce timer.
  4. Timer fires and calls existing save API for the request.
  5. On success, update snapshot and mark `clean`.
- Navigation flow:
  - Request selection only changes active context.
  - Save lifecycle remains tied to request ID, even when request is no longer active.

### 3. Error handling and edge cases

- Save failures set `save_failed` and preserve draft.
- Next edit triggers debounced retry automatically.
- Rapid edits coalesce via debounce to reduce writes.
- If request closes while still dirty/failed, keep minimal in-session cache until unload.
- Out-of-scope for initial slice: persistent recovery via localStorage (possible follow-up).
- Enforce single-flight per request ID:
  - Avoid concurrent saves for same request.
  - Queue latest snapshot if changes happen while save is in flight.

## Scope boundaries

In scope:
- Debounced autosave while typing
- Non-blocking request switching
- Save-state UI indicator
- Failure visibility with retry-on-next-edit behavior

Out of scope (phase 2):
- Durable draft recovery after full page refresh
- Global background sync queue across browser sessions

## Success Criteria

- Switching requests no longer triggers save/discard prompts.
- User edits are persisted automatically during active editing.
- Save failures are visible and do not lose draft content.
- Save request volume is reduced versus per-keystroke submission.
