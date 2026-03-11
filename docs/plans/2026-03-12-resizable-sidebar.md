# Resizable Sidebar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the collections sidebar horizontally resizable with a
persisted width, using a lightweight Postman-like drag handle.

**Architecture:** Keep the current `App.tsx` flex layout, move sidebar
width into app-owned state, insert a custom resize handle between the
sidebar and main content, clamp width to fixed bounds, and persist the
chosen width in `localStorage`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vitest

---

### Task 1: Add focused tests for persisted sidebar width logic

**Files:**
- Create or Modify: `frontend/src/App.test.tsx`
- Check: `frontend/src/App.tsx`

**Step 1: Add failing tests**

Add focused tests for:

- default sidebar width when no saved value exists
- restoring sidebar width from `localStorage`
- ignoring invalid stored width values

If pointer-drag interaction can be tested cleanly, add a narrow drag
lifecycle test. If not, keep drag verification manual.

**Step 2: Run the focused tests**

Run:

```bash
cd frontend && yarn test src/App.test.tsx
```

Expected: FAIL because sidebar width is currently fixed.

**Step 3: Commit test-only updates if needed**

```bash
git add frontend/src/App.test.tsx
git commit -m "test(app): cover resizable sidebar width"
```

### Task 2: Add app-owned sidebar width state and persistence

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Implement width initialization**

Add app-level state for sidebar width with:

- default width equal to current effective width
- `localStorage` restore on load
- invalid-value fallback

**Step 2: Pass width into the shell layout**

Replace the fixed-width sidebar usage with an inline or class-driven
width controlled by state.

Do not move this state into `CollectionsSidebar.tsx`.

**Step 3: Run focused tests**

Run:

```bash
cd frontend && yarn test src/App.test.tsx
```

Expected: PASS for default/restore logic.

**Step 4: Commit**

```bash
git add frontend/src/App.tsx frontend/src/App.test.tsx
git commit -m "feat(app): persist sidebar width"
```

### Task 3: Add the custom resize handle and drag behavior

**Files:**
- Modify: `frontend/src/App.tsx`
- Check: `frontend/src/globals.css`

**Step 1: Implement drag handle**

Add a slim vertical resize handle between the sidebar and main content.

Implement:

- pointer down to start drag
- pointer move to update width
- pointer up / cancel cleanup
- min/max clamping

Use the same pragmatic drag pattern already present elsewhere in the UI
when it fits.

**Step 2: Style the handle**

Make the handle:

- subtle at rest
- clearer on hover
- visually compatible with the current shell

Only add CSS helpers if the existing utility classes are insufficient.

**Step 3: Run regression tests**

Run:

```bash
cd frontend && yarn test src/lib/curl-parser.test.ts src/components/request-builder/VariableAwareUrlInput.test.tsx src/components/request-builder/useRequestBuilderState.test.tsx src/store/__tests__/collections-store.fetch-dedupe.test.ts src/App.test.tsx src/store/__tests__/history-store.fetch-dedupe.test.ts
```

Expected: PASS.

**Step 4: Commit**

```bash
git add frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/globals.css
git commit -m "feat(app): add sidebar resize handle"
```

### Task 4: Manually verify layout behavior

**Files:**
- Check: `frontend/src/App.tsx`

**Step 1: Run the frontend**

Run:

```bash
cd frontend && yarn dev --host 127.0.0.1 --port 5173
```

**Step 2: Verify interaction**

Check:

- drag handle hover state
- resize narrower and wider
- width clamping
- reload persistence
- request builder remains usable at min/max sidebar widths

**Step 3: Commit final adjustments**

```bash
git add frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/globals.css
git commit -m "feat(sidebar): support persisted resize"
```
