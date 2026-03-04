# Collection Folder and In-Folder Request Creation Design

## Context
Rocket currently renders folder nodes in the collection sidebar, but users cannot create folders directly from the UI. Users also cannot explicitly create a request under a selected folder in a Postman/Bruno-like way.

## Problem
Collections sidebar lacks first-class creation flows for:
- creating folders under collection root or nested folders
- creating requests directly inside a selected folder

This creates a parity gap with Postman/Bruno collection workflow.

## Goals
- Add folder creation at root and nested levels.
- Add request creation at root and nested folder levels.
- Ensure new items are visible immediately by refreshing and expanding tree state.
- Preserve current request-tab behavior (open distinct requests in distinct tabs; focus existing when same request already open).

## Non-Goals
- Folder rename/move/delete in this phase.
- Bulk import/export changes.
- Reworking existing collection tree rendering architecture.

## UX Contract
1. On collection node, user can choose:
   - `New Folder`
   - `New Request`
2. On folder node, user can choose:
   - `New Folder`
   - `New Request`
3. Creating a folder:
   - prompts for folder name
   - creates folder under selected parent path
   - refreshes tree and expands path to new folder
4. Creating a request:
   - prompts for request name (and optional method defaulting to GET)
   - creates `<name>.bru` under selected parent path
   - refreshes tree, expands to new request, and opens/focuses tab per existing tab rules

## Recommended Approach
Backend-first with explicit APIs.

### Why
- clear contract for folder and request creation
- better validation and conflict reporting
- easier future extension (rename/move/delete)

## Architecture

### Backend
Add endpoints:
1. `POST /api/v1/collections/{name}/folders`
   - payload: `{ parentPath?: string, folderName: string }`
   - behavior: create directory at `<collection>/<parentPath>/<folderName>`

2. `POST /api/v1/collections/{name}/requests/new`
   - payload: `{ parentPath?: string, requestName: string, method?: string }`
   - behavior: create `<requestName>.bru` at target path with starter bru content

Use repository-safe path composition and reject traversal (`..`) or absolute path input.

### Frontend API client
Extend `frontend/src/lib/api.ts` with:
- `createFolder(collection: string, parentPath: string | undefined, folderName: string)`
- `createRequest(collection: string, parentPath: string | undefined, requestName: string, method?: string)`

### Sidebar/UI
In `CollectionsSidebar.tsx`:
- add context menu items for collection/folder nodes
- add create dialog state for mode: `folder` or `request`
- on submit:
  - call API
  - refresh `fetchCollectionTree(activeCollection.name)`
  - expand collection and ancestor folders
  - for new request: call `loadRequestFromPath(collection, newRequestPath)`

## Error Handling
Backend returns structured 4xx messages for:
- empty/invalid names
- duplicate folder/request path
- invalid parent path / traversal

Frontend surfaces these errors in alert/toast/dialog form:
- “Folder already exists”
- “Request already exists”
- “Invalid name/path”

## Testing Strategy

### Backend tests
- create folder at collection root
- create nested folder under parent folder
- create request under folder
- duplicate folder/request conflict
- traversal rejection

### Frontend tests
- collection/folder node actions render correctly
- correct payload generation for parentPath + names
- tree refresh and expansion state after create
- new request opens in tab and preserves dedupe behavior

## Acceptance Criteria
- User can create folders from collection and folder nodes.
- User can create request under selected collection/folder path.
- New folder/request is visible immediately in expanded tree.
- New request opens in a tab; re-clicking same request focuses existing tab.
