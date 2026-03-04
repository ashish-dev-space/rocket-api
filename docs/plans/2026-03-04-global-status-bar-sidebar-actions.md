# Global Status Bar Sidebar Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move sidebar footer quick actions into a compact app-wide status bar while preserving existing action behavior.

**Architecture:** Introduce a dedicated `GlobalStatusBar` component rendered by `App.tsx` below the main workspace split. Move bottom-action handlers/dialogs (`New Collection`, `Import Collection`, `Templates`, `Cookies`) into this component, and remove obsolete sidebar footer action UI and related state/handlers from `CollectionsSidebar.tsx`.

**Tech Stack:** React 19, TypeScript, Zustand stores, Tailwind CSS, shadcn UI components.

---

### Task 1: Create compact global status bar component

**Files:**
- Create: `frontend/src/components/layout/GlobalStatusBar.tsx`

**Step 1: Write the failing test**
- Not required for this UI relocation and styling change; no business logic contract change.

**Step 2: Write minimal implementation**
- Add compact bottom bar container with `h-7`, `text-[11px]`, and small icon buttons.
- Implement actions in this component:
  - New collection create dialog + submit flow.
  - Import collection file picker flow.
  - Templates dialog with category filter and `loadRequestInActiveTab`.
  - Cookies dialog with domain filter and cookie operations.
- Reuse existing APIs/stores currently used in sidebar for behavior parity.

**Step 3: Run verification**
Run:
- `cd frontend && yarn -s lint`
Expected: PASS.

**Step 4: Commit**
```bash
git add frontend/src/components/layout/GlobalStatusBar.tsx
git commit -m "feat(frontend): add compact global status bar quick actions"
```

### Task 2: Integrate status bar into app shell

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Write minimal implementation**
- Import and render `GlobalStatusBar` at the bottom of the app shell, after main content.
- Ensure app layout still fills viewport and status bar remains fixed within app frame.

**Step 2: Run verification**
Run:
- `cd frontend && yarn -s lint`
Expected: PASS.

**Step 3: Commit**
```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): mount global status bar in app layout"
```

### Task 3: Remove sidebar footer quick action block and obsolete logic

**Files:**
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx`

**Step 1: Write minimal implementation**
- Remove footer action buttons block for `New Collection`, `Import Collection`, `Templates`, `Cookies`.
- Remove now-unused state, handlers, and dialog markup related to templates/cookies/footer-only actions.
- Keep collection tree and other sidebar behavior unchanged.

**Step 2: Run verification**
Run:
- `cd frontend && yarn -s lint`
- `cd frontend && yarn -s test`
Expected: PASS.

**Step 3: Manual checks**
- Verify status bar appears at bottom and uses compact height/font.
- Verify each moved action behaves as before.
- Verify sidebar no longer shows bottom action block.

**Step 4: Commit**
```bash
git add frontend/src/components/collections/CollectionsSidebar.tsx
git commit -m "refactor(frontend): move sidebar footer quick actions to status bar"
```
