# Collection Accordion Behavior Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the stale-arrow / empty-content bug by replacing the multi-entry `expandedCollections` Set with two separate state variables: a single `expandedCollectionId` for top-level collections (accordion) and a `expandedFolders` Set for subfolders.

**Architecture:** All changes are in one component file. `expandedCollections: Set<string>` is split into `expandedCollectionId: string | null` (one-at-a-time for collections) and `expandedFolders: Set<string>` (independent expand/collapse for subfolders inside the open collection). `toggleCollection` is rewritten to set the single ID. `renderTreeNode` gets its own subfolder toggle that writes to `expandedFolders`.

**Tech Stack:** React, TypeScript, useState

---

### Task 1: Replace expand state and update all references

**Files:**
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx`

**Step 1: Read the file to understand the current state**

```bash
# The relevant lines are roughly:
# Line 55:  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
# Line 120: toggleCollection function
# Line 301: renderTreeNode folder block (uses expandedCollections for subfolders)
# Line 412: isExpanded for collection header
# Line 484: tree render condition
```

**Step 2: Replace the state declaration**

Find:
```tsx
const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
```

Replace with:
```tsx
const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(null)
const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
```

**Step 3: Replace `toggleCollection`**

Find:
```tsx
const toggleCollection = (collectionId: string) => {
  const newExpanded = new Set(expandedCollections)
  if (newExpanded.has(collectionId)) {
    newExpanded.delete(collectionId)
  } else {
    newExpanded.add(collectionId)
  }
  setExpandedCollections(newExpanded)
}
```

Replace with:
```tsx
const toggleCollection = (id: string) => {
  setExpandedCollectionId(prev => prev === id ? null : id)
  setExpandedFolders(new Set())
}
```

Resetting `expandedFolders` on every collection toggle ensures subfolder state never leaks between collections.

**Step 4: Update the collection header's `isExpanded`**

Find (inside `filteredCollections.map`):
```tsx
const isExpanded = expandedCollections.has(collection.id)
```

Replace with:
```tsx
const isExpanded = expandedCollectionId === collection.id
```

**Step 5: Update `renderTreeNode` folder block**

Find the folder branch inside `renderTreeNode` (around line 300):
```tsx
if (node.type === 'folder') {
  const isExpanded = expandedCollections.has(node.path || node.name)
  return (
    <div key={node.path || node.name}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleCollection(node.path || node.name)}
        ...
      >
```

Replace with:
```tsx
if (node.type === 'folder') {
  const folderKey = node.path || node.name
  const isExpanded = expandedFolders.has(folderKey)
  return (
    <div key={folderKey}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setExpandedFolders(prev => {
            const next = new Set(prev)
            next.has(folderKey) ? next.delete(folderKey) : next.add(folderKey)
            return next
          })
        }}
        ...
      >
```

The rest of the folder block (chevron icons, children render) is unchanged.

**Step 6: Build to verify no TypeScript errors**

```bash
cd /home/numericlabs/data/rocket-api/frontend && npm run build 2>&1
```

Expected: `✓ built in X.XXs` with no errors.

**Step 7: Self-review checklist**

- `expandedCollections` and `setExpandedCollections` appear nowhere in the file (search for them)
- `toggleCollection` only writes to `expandedCollectionId` and resets `expandedFolders`
- Folder nodes in `renderTreeNode` read from `expandedFolders` and write via `setExpandedFolders`
- Collection header `isExpanded` uses `expandedCollectionId === collection.id`
- Tree render condition `isExpanded && isActive && collectionTree?.children` is unchanged

**Step 8: Commit**

```bash
cd /home/numericlabs/data/rocket-api
git add frontend/src/components/collections/CollectionsSidebar.tsx
git commit -m "fix(sidebar): accordion behavior — one collection expanded at a time"
```

---

### Task 2: Push and verify

**Step 1: Push**

```bash
cd /home/numericlabs/data/rocket-api
git push
```

**Step 2: Manual smoke test**

1. Open the app — expand collection A → requests appear.
2. Click collection B — A collapses (arrow up, no content), B expands and shows its requests.
3. Click collection B again → B collapses, sidebar is fully collapsed.
4. Expand a collection that has subfolders — verify subfolders still expand/collapse independently.
5. Expand subfolder X inside collection A, then click collection B → switch to B; go back to A and confirm subfolder X is collapsed (fresh state).
