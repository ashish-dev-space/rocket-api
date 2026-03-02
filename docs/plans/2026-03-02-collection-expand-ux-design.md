# Collection Expand UX — Design

**Date:** 2026-03-02
**Status:** Approved

## Problem

The collection row in the sidebar has two separate clickable elements:
1. A small chevron `<Button>` — only toggles `isExpanded`
2. A wider name `<Button>` — only calls `setActiveCollection`

The collection tree is rendered only when `isExpanded && isActive` (both conditions must be true). Users must click both the chevron and the collection name separately before requests appear. This is confusing.

## Design

**One file:** `frontend/src/components/collections/CollectionsSidebar.tsx`

**Two changes:**

### 1. Merge the two buttons into a single clickable row

Replace the separate chevron `<Button>` and name `<Button>` with a single element that wraps the chevron icon, folder icon, name, and request count. One click handler calls both `toggleCollection(collection.id)` and `setActiveCollection(collection)`.

The export and delete action icons on the right remain as separate buttons, hover-revealed, unchanged.

### 2. Drop `isActive` from the tree render condition

Change:
```tsx
{isExpanded && isActive && collectionTree?.children && (
```

To:
```tsx
{isExpanded && collectionTree?.children && (
```

This is safe: `setActiveCollection` is always called when expanding, which triggers the existing `useEffect` that calls `fetchCollectionTree`.

## Behaviour After Change

- Click anywhere on the collection row → expands and shows requests immediately
- Click again → collapses
- Hover → export/delete icons appear (unchanged)

## What Is Unaffected

- Export and delete action buttons
- `fetchCollectionTree` / `setActiveCollection` / `toggleCollection` logic
- All other sidebar functionality (history, search, templates, cookies)

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/collections/CollectionsSidebar.tsx` | Merge chevron + name into single row button; drop `isActive` from tree render condition |
