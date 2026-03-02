# Collection Accordion Behavior — Design

**Date:** 2026-03-02
**Status:** Approved

## Problem

`expandedCollections` is a `Set<string>` that can hold multiple collection IDs. When the user expands collection B while A is already expanded:
- B becomes active → `fetchCollectionTree` fetches B's tree → `collectionTree` now holds B's data
- A remains in the Set (arrow stays down) but its tree doesn't render (not active) → shows empty

The Set abstraction is wrong for a one-at-a-time model, and the stale expanded state causes the confusing empty-but-arrow-down visual.

## Design

**One file:** `frontend/src/components/collections/CollectionsSidebar.tsx`

### Split expanded state into two variables

| Variable | Type | Purpose |
|----------|------|---------|
| `expandedCollectionId` | `string \| null` | Which top-level collection is open (one at a time) |
| `expandedFolders` | `Set<string>` | Which subfolders inside the open collection are expanded |

### Replace `expandedCollections` state

```ts
// Remove
const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())

// Add
const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(null)
const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
```

### Replace `toggleCollection`

```ts
const toggleCollection = (id: string) => {
  setExpandedCollectionId(prev => prev === id ? null : id)
  setExpandedFolders(new Set()) // reset subfolder state when switching collections
}
```

Resetting `expandedFolders` on every toggle means subfolders always start collapsed when you open a collection — clean state, no stale expansions from a previous collection.

### Update collection header references

```ts
// Before
const isExpanded = expandedCollections.has(collection.id)

// After
const isExpanded = expandedCollectionId === collection.id
```

### Update subfolder references in `renderTreeNode`

```ts
// Before
const isExpanded = expandedCollections.has(node.path || node.name)
const onClick = () => toggleCollection(node.path || node.name)

// After
const isExpanded = expandedFolders.has(node.path || node.name)
const onClick = () => {
  const key = node.path || node.name
  setExpandedFolders(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })
}
```

## Behaviour After Change

- Click collection A → expands, shows requests
- Click collection B → A collapses (accordion), B expands, shows its requests
- Click collection B again → B collapses, nothing expanded
- Subfolders inside the open collection still expand/collapse independently

## What Is Unaffected

- `toggleCollection` is still called from the collection row click handler (no change needed there)
- `setActiveCollection` call is unchanged
- Tree render condition `isExpanded && isActive && collectionTree?.children` is unchanged

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/collections/CollectionsSidebar.tsx` | Replace `expandedCollections` Set with `expandedCollectionId` + `expandedFolders`; update all references |
