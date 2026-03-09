# Design: Scripts Tab Visibility Fix

**Date**: 2026-03-09

## Problem

The Language selector and script editors (pre-request, post-response) from the Scripts tab
were rendering visibly when other tabs (e.g. Params) were active.

## Root Cause

`RequestBuilderTabs.tsx` uses `forceMount` on the Scripts `TabsContent` to keep Monaco
editors mounted across tab switches, preventing height and state initialization issues.
Radix UI marks inactive tab panels with `data-state="inactive"` and the HTML `hidden`
attribute, but if the `hidden` attribute is not respected by the CSS context, the content
bleeds through.

## Solution

Add the Tailwind variant `data-[state=inactive]:hidden` to the Scripts `TabsContent`
className. This explicitly sets `display: none` via CSS when the tab panel is inactive,
while `forceMount` still keeps the DOM nodes alive for Monaco.

## Change

**File**: `frontend/src/components/request-builder/RequestBuilderTabs.tsx`

```tsx
// Before
<TabsContent value="scripts" className="mt-0 h-full" forceMount>

// After
<TabsContent value="scripts" className="mt-0 h-full data-[state=inactive]:hidden" forceMount>
```

## Scope

- One file, one line changed.
- No state management changes.
- No component extraction.
- Monaco editor mount state is preserved.
