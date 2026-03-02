# Request Row Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish request rows in the collections sidebar with a colored method pill, remove noise icons, add active state, and add a More (`...`) hover button that opens a dropdown with Rename and Delete actions.

**Architecture:** All changes are in `CollectionsSidebar.tsx`. No backend changes needed — rename reads + saves via existing `apiService.getRequest` / `apiService.saveRequest`, and delete uses `apiService.deleteRequest`. Two new state variables are added for the rename dialog.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn DropdownMenu, shadcn Dialog (already imported), shadcn AlertDialog (already imported)

---

### Task 1: Visual polish — method pill, name, active state, More button stub

**Files:**
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx`

**Background:** The current request branch in `renderTreeNode` (lines 271–293) is:
```tsx
<Button variant="ghost" size="sm" className="w-full justify-start gap-2 px-2 py-1.5 h-auto hover:bg-accent/50 group" style={{ paddingLeft }}>
  <span className={`text-[10px] font-semibold w-10 shrink-0 ${getMethodColor(node.method)}`}>
    {node.method || 'GET'}
  </span>
  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
  <span className="truncate text-left text-muted-foreground group-hover:text-foreground text-xs">
    {node.name}
  </span>
</Button>
```

**Step 1: Add new imports**

Add `MoreHorizontal` to the lucide-react import block (line 29) and add the shadcn DropdownMenu imports after the AlertDialog imports.

Find:
```tsx
import {
  Folder,
  FolderOpen,
  FileText,
  Plus,
  ChevronRight,
  ChevronDown,
  Search,
  Clock,
  Upload,
  Download,
  Trash2,
  Loader2,
  LayoutTemplate,
  Cookie
} from 'lucide-react'
```

Replace with:
```tsx
import {
  Folder,
  FolderOpen,
  Plus,
  ChevronRight,
  ChevronDown,
  Search,
  Clock,
  Upload,
  Download,
  Trash2,
  Loader2,
  LayoutTemplate,
  Cookie,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
```

Note: `FileText` is removed from the import since we're removing the icon from the row.

**Step 2: Add rename dialog state and update getMethodColor**

Add the two new state variables after the `alertDialog` state (around line 78). Find:
```tsx
  // History store
  const {
```

Replace with:
```tsx
  // Rename dialog state
  const [renameDialog, setRenameDialog] = useState<{ isOpen: boolean; node: TreeNode | null }>({
    isOpen: false,
    node: null,
  })
  const [renameValue, setRenameValue] = useState('')

  // History store
  const {
```

Also update `getMethodColor` to return pill classes (background + text) instead of just text color. Find:
```tsx
  const getMethodColor = (method?: string) => {
    const colors: Record<string, string> = {
      GET: 'text-blue-600',
      POST: 'text-green-600',
      PUT: 'text-yellow-600',
      DELETE: 'text-red-600',
      PATCH: 'text-purple-600',
    }
    return colors[method || 'GET'] || 'text-gray-600'
  }
```

Replace with:
```tsx
  const getMethodColor = (method?: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-yellow-100 text-yellow-700',
      DELETE: 'bg-red-100 text-red-700',
      PATCH: 'bg-purple-100 text-purple-700',
    }
    return colors[method?.toUpperCase() || 'GET'] || 'bg-gray-100 text-gray-600'
  }
```

**Step 3: Replace the request row markup**

Find the entire request branch in `renderTreeNode` (lines 271–293):
```tsx
    if (node.type === 'request') {
      return (
        <Button
          key={node.path || node.name}
          variant="ghost"
          size="sm"
          onClick={() => {
            if (activeCollection && node.path) {
              loadRequestFromPath(activeCollection.name, node.path)
            }
          }}
          className="w-full justify-start gap-2 px-2 py-1.5 h-auto hover:bg-accent/50 group"
          style={{ paddingLeft: `${paddingLeft + 24}px` }}
        >
          <span className={`text-[10px] font-semibold w-10 shrink-0 ${getMethodColor(node.method)}`}>
            {node.method || 'GET'}
          </span>
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="truncate text-left text-muted-foreground group-hover:text-foreground text-xs">
            {node.name}
          </span>
        </Button>
      )
    }
```

Replace with:
```tsx
    if (node.type === 'request') {
      const { activeTab: activeTabData } = useTabsStore.getState()
      const isActiveRequest = activeTabData?.filePath === node.path

      return (
        <div
          key={node.path || node.name}
          className={`flex items-center group hover:bg-accent/50 transition-colors ${
            isActiveRequest ? 'border-l-2 border-primary bg-accent/60' : 'border-l-2 border-transparent'
          }`}
          style={{ paddingLeft: `${paddingLeft + 24}px` }}
        >
          <button
            type="button"
            className="flex items-center gap-2 flex-1 min-w-0 py-1.5 pr-1 text-left"
            onClick={() => {
              if (activeCollection && node.path) {
                loadRequestFromPath(activeCollection.name, node.path)
              }
            }}
          >
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded w-[42px] text-center shrink-0 ${getMethodColor(node.method)}`}>
              {node.method || 'GET'}
            </span>
            <span className="truncate text-xs text-foreground">
              {node.name}
            </span>
          </button>

          {/* More button — revealed on row hover */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex items-center justify-center rounded hover:bg-accent shrink-0 mr-1"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setRenameDialog({ isOpen: true, node })
                  setRenameValue(node.name)
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setAlertDialog({
                    isOpen: true,
                    title: 'Delete Request',
                    description: `Are you sure you want to delete "${node.name}"? This action cannot be undone.`,
                    onConfirm: async () => {
                      if (activeCollection && node.path) {
                        await apiService.deleteRequest(activeCollection.name, node.path)
                        await fetchCollectionTree(activeCollection.name)
                      }
                      setAlertDialog(prev => ({ ...prev, isOpen: false }))
                    }
                  })
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
```

**Step 4: Build to verify no TypeScript errors**

```bash
cd /home/numericlabs/data/rocket-api/frontend && npm run build 2>&1
```

Expected: `✓ built in X.XXs` with no errors.

**Step 5: Self-review checklist**

- `FileText` is not imported and not used anywhere in the file
- `getMethodColor` returns `bg-*` + `text-*` classes (pill style)
- `MoreHorizontal` and `DropdownMenu*` are imported
- Request row is a layout `<div>` with `group` class, inner `<button>` for the clickable area
- More button has `opacity-0 group-hover:opacity-100`
- `renameDialog` and `renameValue` state are declared

**Step 6: Commit**

```bash
cd /home/numericlabs/data/rocket-api
git add frontend/src/components/collections/CollectionsSidebar.tsx
git commit -m "feat(sidebar): polish request rows with method pill and More button"
```

---

### Task 2: Add Rename dialog

**Files:**
- Modify: `frontend/src/components/collections/CollectionsSidebar.tsx`

**Background:** The rename flow is:
1. `renameDialog.isOpen` opens a Dialog pre-filled with `renameValue`
2. On confirm: `apiService.getRequest` → set `bruFile.meta.name` → `apiService.saveRequest` → `fetchCollectionTree`
3. On cancel: close dialog

We need to check the `apiService` types to know the exact BruFile shape.

**Step 1: Check the apiService types**

Read `frontend/src/lib/api.ts` to find the BruFile type and getRequest/saveRequest signatures.

```bash
grep -n "getRequest\|saveRequest\|BruFile\|meta" /home/numericlabs/data/rocket-api/frontend/src/lib/api.ts | head -40
```

**Step 2: Add the Rename dialog to the JSX**

Add the rename dialog just before the closing `</TooltipProvider>` tag (before the existing `{/* Create Collection Dialog */}` or after the Alert Dialog). Find:

```tsx
      {/* Alert Dialog for Confirmations */}
      <AlertDialog open={alertDialog.isOpen} onOpenChange={(open) => setAlertDialog(prev => ({ ...prev, isOpen: open }))}>
```

Add before it:
```tsx
      {/* Rename Request Dialog */}
      <Dialog open={renameDialog.isOpen} onOpenChange={(open) => setRenameDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[420px] gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 space-y-1">
            <DialogTitle className="text-base font-semibold tracking-tight">
              Rename Request
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Enter a new name for this request.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameConfirm()
                }}
                autoFocus
                className="h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/40 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenameDialog({ isOpen: false, node: null })}
              className="h-8 px-4 text-sm font-normal"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRenameConfirm}
              disabled={!renameValue.trim()}
              className="h-8 px-4 text-sm font-medium"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

```

**Step 3: Add the handleRenameConfirm function**

Add the handler alongside the other handlers (e.g., after `handleDeleteCollection`). Find:

```tsx
  const handleImportBruno = async () => {
```

Add before it:
```tsx
  const handleRenameConfirm = async () => {
    const node = renameDialog.node
    if (!node || !node.path || !activeCollection || !renameValue.trim()) return
    try {
      const bruFile = await apiService.getRequest(activeCollection.name, node.path)
      bruFile.meta.name = renameValue.trim()
      await apiService.saveRequest(activeCollection.name, node.path, bruFile)
      await fetchCollectionTree(activeCollection.name)
    } catch (error) {
      console.error('Failed to rename request:', error)
    }
    setRenameDialog({ isOpen: false, node: null })
  }

```

**Step 4: Build to verify no TypeScript errors**

```bash
cd /home/numericlabs/data/rocket-api/frontend && npm run build 2>&1
```

Expected: `✓ built in X.XXs` with no errors. If there are type errors on `bruFile.meta.name`, read `api.ts` and adjust the property path to match the actual BruFile shape.

**Step 5: Self-review checklist**

- `handleRenameConfirm` reads the bru file, patches `meta.name`, saves, and refreshes the tree
- Dialog closes on both Confirm and Cancel
- Confirm button is disabled when `renameValue` is empty
- No new lint warnings

**Step 6: Commit**

```bash
cd /home/numericlabs/data/rocket-api
git add frontend/src/components/collections/CollectionsSidebar.tsx
git commit -m "feat(sidebar): add Rename dialog for request rows"
```

---

### Task 3: Push and verify

**Step 1: Push**

```bash
cd /home/numericlabs/data/rocket-api
git push
```

**Step 2: Manual smoke test**

1. Open the app — expand a collection.
2. Verify request rows show colored method pill (blue GET, green POST, etc.) with no file icon.
3. Hover a request row — confirm the `...` button appears on the right.
4. Click `...` → confirm dropdown shows **Rename** and **Delete** items (Delete in red).
5. Click Rename → dialog opens pre-filled with the request name → change it → confirm → sidebar refreshes with the new name.
6. Click `...` → Delete → confirm alert → request disappears from the tree.
7. Click a request to open it → confirm it gets highlighted with the left border + background.
