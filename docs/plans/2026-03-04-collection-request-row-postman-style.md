# Collection Request Row Postman-Style Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle collection sidebar request rows to a compact Postman-like look while preserving existing request-tree behavior.

**Architecture:** Keep all behavior in `CollectionsSidebar.tsx` unchanged and apply a presentation-only update inside the request-node branch of `renderTreeNode`. Replace the pill method badge with compact method text styling, tighten spacing, and strengthen active/hover visuals using existing theme-aware utility classes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, shadcn UI primitives, Vitest.

---

### Task 1: Add/adjust method text style mapping

**Files:**
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx`
- Test: `frontend/src/store/__tests__/tabs-store.save-target-and-dirty.test.ts` (regression sanity only)

**Step 1: Write the failing test**
- Not required for this visual-only class/style change; no behavior/path logic changes.

**Step 2: Run targeted safety test before changes**
Run: `cd frontend && yarn -s test`
Expected: PASS for existing store/tab behavior tests.

**Step 3: Write minimal implementation**
- Update `getMethodColor` (or equivalent helper) to return compact text color classes suitable for inline method labels.
- Ensure method string remains uppercase and fixed-width aligned.

**Step 4: Run lint/test to verify**
Run:
- `cd frontend && yarn -s lint`
- `cd frontend && yarn -s test`
Expected: PASS.

**Step 5: Commit**
```bash
git add frontend/src/components/collections/CollectionsSidebar.tsx
git commit -m "style(frontend): refine request method label styling in sidebar"
```

### Task 2: Restyle request row layout to compact Postman-like appearance

**Files:**
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx`

**Step 1: Write the failing test**
- Not required for this visual-only update; no interaction logic changes.

**Step 2: Write minimal implementation**
- In request-node render branch:
  - reduce row vertical density and horizontal gaps.
  - remove pill badge styling and apply plain method text slot.
  - strengthen active-row classes (subtle fill + left accent + foreground emphasis).
  - keep hover row background subtle.
  - reserve trailing action menu width to prevent text shift.

**Step 3: Run lint/test to verify**
Run:
- `cd frontend && yarn -s lint`
- `cd frontend && yarn -s test`
Expected: PASS.

**Step 4: Manual verification**
- Open two requests and switch tabs; confirm selected request row remains clearly highlighted.
- Hover any request row; confirm `...` action appears without content jump.
- Validate both light and dark themes.

**Step 5: Commit**
```bash
git add frontend/src/components/collections/CollectionsSidebar.tsx
git commit -m "style(frontend): make collection request rows compact and postman-like"
```
