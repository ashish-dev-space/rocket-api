# Resizable Sidebar Design

## Summary

The collections sidebar should be horizontally resizable like Postman.
Users should be able to drag a slim vertical handle between the sidebar
and the main content, adjust the sidebar width in real time, and keep
that width across reloads.

This design keeps the existing app-shell layout and adds a custom,
persisted sidebar width control instead of refactoring the whole shell
to a panel library.

## Current Problem

The collections sidebar in `App.tsx` is currently fixed-width
(`w-72`). Users cannot widen it for long collection names or narrow it
to prioritize request-builder space.

## Goals

- Make the collections sidebar horizontally resizable.
- Keep the interaction lightweight and Postman-like.
- Persist the chosen width across reloads.
- Enforce min/max bounds so the sidebar remains usable.
- Preserve current layout behavior outside of the sidebar width.

## Non-Goals

- Full app-shell migration to a panel layout library.
- Resizable behavior for every panel in the application.
- Sidebar collapse/expand mode in this change.

## Recommended Approach

### 1. App-owned sidebar width state

`App.tsx` should own the sidebar width state because the resize affects
the shell layout, not just sidebar internals.

The width should initialize from `localStorage`, fall back to the
current default width when unset, and update live while dragging.

### 2. Custom vertical resize handle

Insert a slim drag handle between `CollectionsSidebar` and the main
content region.

Interaction requirements:

- subtle idle appearance
- clearer hover state
- horizontal resize cursor
- real-time resize during drag
- pointer listeners cleaned up correctly on drag end

### 3. Width clamping

Clamp width to reasonable bounds so the sidebar:

- cannot become too narrow to scan
- cannot become so wide that it harms the main workspace

Initial implementation should use fixed pixel min/max bounds rather than
responsive percentage rules.

### 4. Persist width across reloads

Save the selected width to `localStorage` after updates so the layout
restores on refresh.

## Expected Interaction

1. App loads and reads stored sidebar width.
2. Sidebar renders at stored width or default width.
3. User hovers the divider and sees a subtle visual affordance.
4. User drags left or right.
5. Sidebar width updates within min/max bounds.
6. Reload keeps the same width.

## Error Handling

If stored width is invalid or missing:

- ignore it
- fall back to the default width

Pointer listeners must always be removed on drag end or component
unmount to avoid stuck drag state.

## Testing

Add focused frontend tests for:

- default width behavior
- stored width restoration
- width clamping
- drag lifecycle if a stable test seam exists

Manual verification should cover:

- narrow and wide drag states
- page reload persistence
- hover and drag affordance quality
- layout integrity of the request builder and collection content

The feature is complete when the sidebar resizes smoothly and restores
the chosen width after refresh without disturbing the rest of the app.
