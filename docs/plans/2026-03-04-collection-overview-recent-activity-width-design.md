# Collection Overview Recent Activity Width Design

## Problem
`Recent Activity` currently renders full-width in the Collection Overview page, while `Method Breakdown` renders inside the left content column. This creates inconsistent layout rhythm.

## Goal
Make `Recent Activity` width match `Method Breakdown` width.

## Approved Direction
Move `Recent Activity` into the same left column container that holds `Method Breakdown` so both cards share identical column width.

## Scope
In scope:
- Layout-only change in `CollectionOverview.tsx`.

Out of scope:
- Data logic, sorting, or row content changes in `Recent Activity`.
- Changes to `Quick Actions`/`Environments` behavior.

## Validation
- `Recent Activity` card width visually matches `Method Breakdown`.
- Right column remains as-is.
- Lint and tests pass.
