# Bruno Import Parity for Lockstep Collection Design

**Date:** 2026-03-05
**Status:** Approved

## Problem
Rocket Bruno import from `Lockstep-Inbox.zip` is not fully Bruno-parity. While core fields are parsed, parity gaps remain for structured `params:path` and disabled entries (`~`) across headers/query/path. This causes incomplete request reconstruction after import.

## Goal
Ensure imported Bruno requests preserve and expose all core request semantics for all common HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`) including:
- method + URL
- headers
- query params
- path params
- auth
- body
- enabled/disabled state for applicable entries

## Non-Goals
- No Bruno file format rewrite.
- No frontend inference hacks for missing backend structure.
- No destructive normalization that drops disabled/commented intent.

## Selected Approach
Parser-first Bruno parity in backend.

## Architecture
- Keep `.bru` files as source of truth.
- Extend parser model to capture:
  - `params:path` block as structured path params.
  - `enabled` state derived from Bruno disabled marker `~` for headers/query/path entries.
- Keep existing method block mapping and inline body capture behavior.
- Return parsed structured data through request load APIs so frontend renders parity data directly.

## Data Flow
1. `ImportBruno` saves `.bru` files unchanged.
2. Request load path parses `.bru` into structured model.
3. Response includes structured headers/query/path with enabled flags, auth, and body.
4. UI consumes structured model directly and preserves Bruno semantics.

## Disabled Entry Semantics
- Bruno prefix `~` means entry exists but disabled.
- Preserve disabled entries on import and parse.
- Do not drop or auto-enable disabled entries.

## Error Handling
- Parser must not panic on malformed blocks.
- On malformed entries, keep existing resilience behavior (best effort/error path consistent with existing parser contract).

## Verification Criteria
1. Representative requests from `Lockstep-Inbox.zip` parse with full method/url/auth/body/headers/query/path fields.
2. `params:path` is present as structured data in response.
3. `~` entries are preserved with `enabled=false`.
4. Body remains non-truncated and JSONC text is preserved.
5. Existing parser and handler tests stay green.

