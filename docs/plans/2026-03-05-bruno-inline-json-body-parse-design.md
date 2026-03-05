# Bruno Inline JSON Body Parsing Design

**Date:** 2026-03-05
**Status:** Approved

## Problem
Imported Bruno requests from `Lockstep-Inbox.zip` can return truncated `body.data` from backend parse/load APIs. This produces invalid JSON in the UI and warning states, even when the source `.bru` payload is valid Bruno-style JSONC.

Example observed backend response body:
- `"data": "{\n  \"value\": \"en-US\""`
- Missing closing braces indicates parser block termination bug.

## Goal
Ensure backend request parsing returns complete body content for Bruno inline body blocks (`body:json { ... }`), including nested braces, comments, and trailing commas.

## Non-Goals
- No request model redesign.
- No body normalization or comment stripping.
- No frontend-only workaround.

## Constraints
- Keep Bruno compatibility: preserve original body text as authored.
- Avoid regressions for existing `data { ... }` body parsing and roundtrip behavior.

## Root Cause Hypothesis
Parser body capture can stop early when it sees an indented `}` belonging to inner JSON object content, rather than the Bruno block-closing brace.

## Selected Approach
Implement indent-aware body block close detection in backend parser.

### Core behavior
- When entering `body:<type> {` (or `data {`), record opening block indentation.
- While in body capture mode, only terminate the body block when a `}` appears at the same indentation level as the opening block.
- Treat deeper-indented braces as payload content, not block terminators.
- Preserve body text content verbatim (including JSONC comments and trailing commas).

## Alternatives considered
1. Frontend JSONC validation only
- Rejected: does not fix backend truncation.

2. Normalize imported payloads to strict JSON
- Rejected: destructive, loses Bruno comments/style.

3. Heuristic auto-heal for truncated JSON
- Rejected: brittle and unsafe.

## Data flow impact
- `ImportBruno`: unchanged (stores raw `.bru` files).
- `Load request`: parser correctness improved so API response contains full `body.data`.

## Error handling
- Keep current parser resilience patterns.
- No panic on malformed blocks.
- Continue returning parse error/best-effort consistent with existing behavior.

## Verification criteria
1. Imported Lockstep request body is fully returned (not truncated).
2. Nested object payloads in `body:json` parse fully.
3. JSONC content (comments/trailing commas) remains intact.
4. Existing parser tests continue passing.

