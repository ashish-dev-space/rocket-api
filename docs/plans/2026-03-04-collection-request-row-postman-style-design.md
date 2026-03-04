# Collection Request Row Postman-Style Design

## Problem
Request rows in the collections sidebar currently look heavier than Postman and feel less scannable due to pill method badges, loose spacing, and weaker active-state hierarchy.

## Goal
Make request rows visually closer to Postman while preserving existing Rocket behaviors (tree indentation, open/focus behavior, context menu actions).

## Approved Direction
Implement a compact Postman-like row style directly in the existing request-row renderer (`renderTreeNode` in `CollectionsSidebar.tsx`) without changing data flow or tab-selection logic.

## Visual Spec
- Compact row density: reduce vertical padding and tighten gaps.
- Method indicator: replace pill badge with plain uppercase method text in a fixed-width slot.
- Request name: primary label with truncate and stronger legibility.
- Active row: subtle filled background + left accent + stronger foreground.
- Hover row: light background; no layout shift.
- Actions menu: keep hover-visible on all rows, but reserve trailing width to avoid text jump.

## Interaction/Behavior
- No behavior changes to opening/focusing requests.
- No behavior changes to rename/delete actions.
- Maintain current tree depth indentation and active request matching by file path.

## Scope
In scope:
- Request row styling/classes in collections sidebar tree.
- Method color token mapping update for compact text-based method labels.

Out of scope:
- Folder/collection row redesign.
- Sidebar search/history redesign.
- Request open/save/dirty logic.

## Risks and Mitigations
- Risk: contrast regressions across dark/light themes.
  - Mitigation: use semantic Tailwind color tokens already used by app theme.
- Risk: row action button overlap with long names.
  - Mitigation: reserve fixed trailing action space and keep truncate behavior.

## Validation
- Visual check in light and dark themes.
- Verify active row remains correctly selected when switching tabs.
- Verify action menu remains usable on hover and does not shift row layout.
