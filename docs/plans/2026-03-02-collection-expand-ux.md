# Collection Expand UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make clicking a collection row (chevron or name) expand the tree and show requests in one click.

**Architecture:** The collection row currently has two separate buttons — a chevron and a name — wired to different actions. Merge them into a single clickable row that calls both `toggleCollection` and `setActiveCollection` together. Drop the `isActive` guard from the tree render condition so the tree shows whenever `isExpanded` is true.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui

---

### Task 1: Merge collection row into a single clickable element

**Files:**
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx:418-481`

**Background:** The current collection header (lines 418–481) renders as:
```
[div.flex]
  [Button chevron]         ← onClick: toggleCollection
  [Button folder+name]     ← onClick: setActiveCollection
  [div action icons]       ← export, delete (hover-revealed)
```

Both buttons must be clicked separately for the tree to appear (`isExpanded && isActive`). The fix merges the first two into a single clickable row.

**Step 1: Locate the exact block to replace**

In `frontend/src/components/collections/CollectionsSidebar.tsx`, find the collection header div (starts with `<div className={`flex items-center gap-1 px-2 py-1.5 ...`}>`). It contains:
1. A `<Button>` for the chevron (onClick: toggleCollection)
2. A `<Button>` for the folder icon + name + count (onClick: setActiveCollection)
3. A `<div>` with the export/delete action icons

**Step 2: Replace the two buttons with one unified row**

Replace the entire collection header div with:

```tsx
<div
  className={`flex items-center gap-1 px-2 py-1.5 hover:bg-accent/50 transition-colors group cursor-pointer ${
    isActive ? 'bg-accent/40' : ''
  }`}
  onClick={() => {
    toggleCollection(collection.id)
    setActiveCollection(collection)
  }}
>
  <span className="shrink-0 h-5 w-5 flex items-center justify-center">
    {isExpanded ? (
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    ) : (
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
    )}
  </span>
  <span className="flex items-center gap-1.5 flex-1 min-w-0">
    {isExpanded ? (
      <FolderOpen className="h-4 w-4 text-orange-500 shrink-0" />
    ) : (
      <Folder className="h-4 w-4 text-orange-500 shrink-0" />
    )}
    <span className="truncate text-xs font-medium">{collection.name}</span>
    <span className="text-[10px] text-muted-foreground shrink-0">
      ({collection.requestCount})
    </span>
  </span>

  {/* Action icons — stop propagation so clicks don't toggle the row */}
  <div
    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
    onClick={(e) => e.stopPropagation()}
  >
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleExportBruno(collection.name)}
          className="h-6 w-6"
        >
          <Download className="h-3 w-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Export</TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDeleteCollection(collection.name)}
          className="h-6 w-6 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Delete</TooltipContent>
    </Tooltip>
  </div>
</div>
```

Key points:
- The outer `div` is the clickable row — `onClick` calls both `toggleCollection` and `setActiveCollection`.
- The action icons `div` has `onClick={(e) => e.stopPropagation()}` so clicking Export or Delete doesn't also toggle the collection.
- No `<Button>` wrapper on the row itself — `cursor-pointer` on the div is sufficient and avoids button-inside-button nesting issues.

**Step 3: Fix the tree render condition**

Find this line (around line 484 in the original, slightly different after the edit):
```tsx
{isExpanded && isActive && collectionTree?.children && (
```

Change it to:
```tsx
{isExpanded && collectionTree?.children && (
```

**Step 4: Build to verify no TypeScript errors**

```bash
cd /home/numericlabs/data/rocket-api/frontend && npm run build 2>&1
```

Expected: `✓ built in X.XXs` with no errors.

**Step 5: Commit**

```bash
cd /home/numericlabs/data/rocket-api
git add frontend/src/components/collections/CollectionsSidebar.tsx
git commit -m "fix(sidebar): expand collection tree on single click"
```

---

### Task 2: Push and verify

**Step 1: Push**

```bash
cd /home/numericlabs/data/rocket-api
git push
```

**Step 2: Manual smoke test**

1. Open the app — click any collection row once.
2. Confirm the chevron rotates and requests appear immediately (no second click needed).
3. Click the same row again — confirm it collapses.
4. Hover over a collection — confirm Export and Delete icons appear and clicking them does NOT expand/collapse the collection.
5. Expand collection A, then click collection B — confirm B expands and shows its requests.
