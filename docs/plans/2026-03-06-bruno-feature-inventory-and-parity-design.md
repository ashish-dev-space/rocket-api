# Bruno Feature Inventory and Bruno-vs-Rocket Parity Design

## Problem
We need two clear product documents:
1. A Bruno-only feature inventory with a defensible total feature count.
2. A Bruno vs Rocket parity matrix showing supported/partial/missing coverage in this repository.

The current repository has Bruno-related implementation and parity notes, but no single, source-backed inventory or complete parity view.

## Goal
Produce two authoritative docs that:
- quantify Bruno features across Free/Open-source and paid tiers (Golden/Ultimate), and
- map those features to current Rocket support status with code/document evidence.

## Scope
In scope:
- Create `docs/bruno-feature-inventory.md`.
- Create `docs/bruno-vs-rocket-parity-matrix.md`.
- Use official Bruno sources + local Rocket code/docs for parity evidence.

Out of scope:
- Any Rocket implementation changes.
- Any UI/backend feature development.

## Source-of-Truth Strategy
Primary sources only for Bruno features:
- Official Bruno docs (`docs.usebruno.com`).
- Official Bruno site/pricing (`usebruno.com`) for tier mapping.
- Official Bruno GitHub docs/release notes (`github.com/usebruno/bruno`) where needed.

Rocket evidence sources:
- `README.md`, `docs/user-manual.md`, `docs/admin-developer-manual.md`.
- `frontend/src/**` and `backend/**` implementation paths.

## Counting Rules
- Count one user-facing capability as one feature.
- Treat sub-capabilities as nested bullets under a single parent feature.
- De-duplicate repeated mentions across sources.
- Label each feature evidence quality:
  - `Confirmed` (explicitly documented),
  - `Inferred` (derived from context, used sparingly and marked).

## Deliverables
### 1) Bruno-only feature inventory (`docs/bruno-feature-inventory.md`)
- "As of" date.
- Total feature count split by tier (Free/Open-source and paid).
- Categorized inventory table with columns:
  - Feature
  - Tier
  - Evidence status
  - Source link(s)

### 2) Bruno vs Rocket parity matrix (`docs/bruno-vs-rocket-parity-matrix.md`)
- Same "As of" date and source policy.
- Matrix columns:
  - Bruno feature
  - Tier
  - Rocket status (`Supported` / `Partial` / `Missing` / `Unknown`)
  - Rocket evidence (file path/doc reference)
  - Gap note
- Summary totals by status and priority gaps.

## Status Definitions
- `Supported`: implemented and usable in Rocket now.
- `Partial`: some support exists but not Bruno-equivalent.
- `Missing`: no Rocket implementation evidence.
- `Unknown`: insufficient evidence in this repository.

## Risks and Mitigations
- Risk: Feature inflation from over-granular counting.
  - Mitigation: strict parent-feature counting rule.
- Risk: Incorrect tier mapping.
  - Mitigation: tier assignments only from official pricing/docs.
- Risk: Overstating Rocket support.
  - Mitigation: require concrete code/doc evidence for each `Supported` claim.

## Success Criteria
- Both docs exist and are internally consistent.
- Inventory includes total feature count with transparent counting method.
- Parity matrix assigns each feature one status with evidence and clear gap notes.
- Free/Open-source and paid features are both represented.
