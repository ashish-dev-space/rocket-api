# Send Refresh Dedupe Design

## Summary

Clicking `Send` currently triggers one real request send plus a burst of
redundant follow-up reads for collections, environments, collection
variables, and history. The main issue is overlapping ownership of
refresh behavior across components, combined with store fetch methods
that do not coalesce identical in-flight requests.

This design uses a hybrid fix:

1. Remove the most obvious duplicate effect-driven refreshes.
2. Add store-level in-flight dedupe guards for repeated reads.

This reduces request storms immediately without a full state-management
rewrite.

## Current Problem

The send flow in
`frontend/src/components/request-builder/useRequestBuilderState.ts`
correctly owns the direct consequences of sending:

- update the active tab response
- refresh history
- persist script-mutated variables

But several other components also refetch related data based on store
changes or mount events:

- `frontend/src/App.tsx`
- `frontend/src/components/collections/CollectionsSidebar.tsx`
- `frontend/src/components/collections/CollectionOverview.tsx`

That creates repeated requests such as:

- `GET /api/v1/collections`
- `GET /api/v1/collections/:name`
- `GET /api/v1/environments?collection=:name`
- `GET /api/v1/environments?collection=:name&name=:env`
- `GET /api/v1/collections/:name/variables`
- `GET /api/v1/history?limit=50`

The result is a large burst of local backend traffic after one send.

## Goals

- Reduce duplicate read requests triggered by one send action.
- Preserve current user-visible behavior and error handling.
- Keep refresh behavior explicit and understandable.
- Add regression tests for request deduplication.

## Non-Goals

- Redesign the full frontend state architecture.
- Batch script-variable persistence writes.
- Add long-lived caching or stale-time semantics.

## Approach

### 1. Trim duplicate refresh ownership

Refresh responsibility should stay near the state transition that makes
data stale.

The send flow remains responsible for:

- setting the response on the active request tab
- fetching history once after send
- persisting script-mutated variables

Other components should stop opportunistically refetching the same
collection data from `useEffect` when that data is already being managed
elsewhere.

Expected cleanup areas:

- `frontend/src/App.tsx`
  Remove or narrow the effect that reloads collection tree context from
  the active tab when another part of the app already owns that fetch.
- `frontend/src/components/collections/CollectionOverview.tsx`
  Avoid unconditional collection tree and history fetches on mount when
  the same data is already being refreshed by the active workflow.
- `frontend/src/components/collections/CollectionsSidebar.tsx`
  Keep this as the likely primary owner for loading the active
  collection tree, unless store-based ownership becomes simpler during
  implementation.

The implementation should keep exactly one clear owner for loading the
active collection tree.

### 2. Add store-level in-flight dedupe guards

Even after effect cleanup, stores should coalesce identical concurrent
reads.

Add in-flight request guards in
`frontend/src/store/collections.ts` for:

- `fetchCollectionTree(name)`
- `fetchEnvironments(collection)`
- `fetchCollectionVariables(name)`

Add an in-flight guard in
`frontend/src/store/history.ts` for:

- `fetchHistory(limit)`

Behavior of the guards:

- If an identical request is already in flight, return the same promise.
- Clear the in-flight entry when the request resolves or rejects.
- Do not introduce persistent caching beyond the active request window.

This preserves explicit refresh behavior while preventing request storms
from overlapping callers.

## Error Handling

Existing error behavior remains unchanged:

- collection store errors continue to set store error state
- history fetch errors continue to set history error state
- existing console logging paths remain intact

If a coalesced request fails, all concurrent callers observe the same
failure result instead of issuing duplicate failing requests.

## Testing

Add targeted frontend regression tests modeled after the existing
`fetchCollections` dedupe test.

New coverage should verify that concurrent identical calls only trigger
one API request for:

- collection tree fetches
- environments fetches
- collection variables fetches
- history fetches

Manual verification should repeat the send-button scenario and confirm
the network panel drops from the current burst to only the requests that
are actually necessary for one send.

## Expected Outcome

After this change, one click on `Send` should produce:

- one backend health check
- one `/requests/send`
- one history refresh
- only the minimum collection/environment/variable reads still required

Repeated identical reads should be coalesced instead of sent multiple
times.
