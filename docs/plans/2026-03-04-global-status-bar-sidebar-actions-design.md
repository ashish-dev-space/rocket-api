# Global Status Bar For Sidebar Actions Design

## Problem
The collection sidebar currently hosts a bottom action block (`New Collection`, `Import Collection`, `Templates`, `Cookies`). This consumes sidebar vertical space and does not match Postman-like workspace-level quick actions.

## Goal
Move those four actions from the sidebar footer into a compact, app-wide bottom status bar with smaller height and typography.

## Approved Direction
Add a global status bar at the bottom of the app shell and place the four quick actions there, using compact controls (`h-7`, `text-[11px]`, small icons). Remove the old sidebar footer action block.

## Scope
In scope:
- New global status bar component integrated into app layout.
- Move action entry points for `New Collection`, `Import Collection`, `Templates`, and `Cookies` to the global bar.
- Keep behavior parity for dialogs and operations.
- Remove the sidebar footer action section.

Out of scope:
- Full app footer telemetry/status redesign.
- Collection tree behavior changes.
- Request tab/open logic changes.

## UX/Visual Spec
- Status bar height: 28px (`h-7`) and compact typography (`text-[11px]`).
- Compact icon size (`h-3 w-3`) and tight spacing.
- Left-aligned quick action buttons, subtle top border, theme-safe colors.
- Keep light/dark theme parity with existing semantic tokens.

## Behavior
- `New Collection`: opens create collection dialog and creates on submit.
- `Import Collection`: triggers file picker and imports `.zip`.
- `Templates`: opens templates dialog and inserts selected template into active request tab.
- `Cookies`: opens cookie manager dialog.
- Existing collection sidebar interactions remain unchanged.

## Risks and Mitigations
- Risk: duplicate dialog logic after move.
  - Mitigation: centralize moved action/dialog logic inside the new status bar component and delete obsolete sidebar footer logic.
- Risk: compact controls hurt accessibility.
  - Mitigation: keep tooltips/titles and preserve keyboard-focusable buttons.

## Validation
- Visual check that sidebar no longer contains bottom action section.
- Status bar actions open the expected dialogs and perform existing operations.
- Verify compact sizing requirement and no content overflow in light/dark themes.
