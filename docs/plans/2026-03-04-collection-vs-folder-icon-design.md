# Collection vs Folder Icon Differentiation Design

## Context
Collection and folder rows currently use very similar folder icons in the sidebar, making it harder to quickly distinguish top-level collections from nested folders.

## Goal
Visually differentiate collection rows from folder rows while preserving existing navigation and behavior.

## Decision
Use `Database` icon for collection rows and keep folder rows as `Folder` / `FolderOpen`.

## Scope
- Update collection row icon rendering only.
- Keep folder node icons and behavior unchanged.
- No backend/API/store changes.

## UX Contract
- Collection rows always render with `Database` icon.
- Folder rows continue using existing folder icons.
- Expand/collapse, selection, and context menu behavior remain unchanged.

## Technical Notes
- File: `frontend/src/components/collections/CollectionsSidebar.tsx`
- Add `Database` import from `lucide-react`.
- Replace collection row `FolderOpen`/`Folder` icon usage with `Database`.

## Acceptance Criteria
- Collection and folder rows are visually distinct at a glance.
- No regression in collection/sidebar interactions.
