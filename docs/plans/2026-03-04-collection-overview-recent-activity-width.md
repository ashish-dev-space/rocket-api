# Collection Overview Recent Activity Width Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align `Recent Activity` card width with `Method Breakdown` card width in Collection Overview.

**Architecture:** Keep the existing 3-column content grid and relocate `Recent Activity` card into the left `col-span-2` column where `Method Breakdown` lives. No store/state logic changes.

**Tech Stack:** React, TypeScript, Tailwind CSS.

---

### Task 1: Move Recent Activity card into left content column

**Files:**
- Modify: `frontend/src/components/collections/CollectionOverview.tsx`

**Step 1: Write the failing test**
- Not required for this layout-only visual change.

**Step 2: Write minimal implementation**
- Move `Recent Activity` card JSX from full-width section to the left column block below `Method Breakdown`.
- Keep existing card content/logic unchanged.

**Step 3: Verify**
Run:
- `cd frontend && yarn -s lint`
- `cd frontend && yarn -s test`
Expected: PASS.

**Step 4: Commit**
```bash
git add frontend/src/components/collections/CollectionOverview.tsx
git commit -m "style(frontend): align recent activity width with method breakdown"
```
