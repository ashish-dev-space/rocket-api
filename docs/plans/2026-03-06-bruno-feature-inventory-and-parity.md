# Bruno Feature Inventory and Parity Matrix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create two docs: a source-backed Bruno feature inventory (with total count across free and paid tiers) and a Bruno-vs-Rocket parity matrix with supported/partial/missing status.

**Architecture:** Use official Bruno sources as the authoritative inventory input, normalize into a deduplicated feature catalog, then map each feature to Rocket evidence from this repository. Publish two markdown outputs with explicit status/evidence columns and summary totals.

**Tech Stack:** Markdown docs, repository code/docs inspection, web research on official Bruno docs/site/GitHub.

---

### Task 1: Capture canonical Bruno source links

**Files:**
- Modify: `docs/plans/2026-03-06-bruno-feature-inventory-and-parity.md`

**Step 1: List source URLs in plan notes**
Add exact official URLs to use for inventory and tier mapping.

**Step 2: Verify URLs are reachable**
Run: `echo "manual verification via browser/web tool"`
Expected: all links resolve.

**Step 3: Commit source-link note update**
```bash
git add docs/plans/2026-03-06-bruno-feature-inventory-and-parity.md
git commit -m "docs(plans): pin official Bruno sources for inventory work"
```

### Task 2: Build normalized Bruno feature catalog (working draft)

**Files:**
- Create: `docs/bruno-feature-inventory.md`

**Step 1: Write initial categorized inventory skeleton**
Create sections (Core Requesting, Auth, Variables/Env, Scripting/Testing, Runner/CLI, Collaboration, Enterprise/Paid).

**Step 2: Fill features with tier + evidence links**
For each feature, add `Tier`, `Confirmed/Inferred`, and source URL.

**Step 3: Add count summary**
Add total feature count and split by free vs paid.

**Step 4: Self-check de-duplication**
Run: `rg -n "^\|" docs/bruno-feature-inventory.md`
Expected: one row per unique feature.

**Step 5: Commit inventory draft**
```bash
git add docs/bruno-feature-inventory.md
git commit -m "docs: add Bruno feature inventory with tiered feature counts"
```

### Task 3: Define parity mapping rubric in matrix doc

**Files:**
- Create: `docs/bruno-vs-rocket-parity-matrix.md`

**Step 1: Add matrix schema and status definitions**
Include columns and status meaning (`Supported/Partial/Missing/Unknown`).

**Step 2: Seed matrix rows from inventory features**
Mirror feature names exactly to maintain one-to-one mapping.

**Step 3: Commit rubric and scaffold**
```bash
git add docs/bruno-vs-rocket-parity-matrix.md
git commit -m "docs: scaffold Bruno vs Rocket parity matrix and status rubric"
```

### Task 4: Map Rocket evidence for each feature

**Files:**
- Modify: `docs/bruno-vs-rocket-parity-matrix.md`
- Reference: `README.md`, `docs/user-manual.md`, `docs/admin-developer-manual.md`, `frontend/src/**`, `backend/**`

**Step 1: For each feature, locate Rocket evidence**
Use concrete file paths or docs references.

**Step 2: Assign status per rubric**
Set `Supported`, `Partial`, `Missing`, or `Unknown` with a short gap note.

**Step 3: Add parity summary totals**
Include counts by status and top-priority gaps.

**Step 4: Commit parity mapping**
```bash
git add docs/bruno-vs-rocket-parity-matrix.md
git commit -m "docs: map Bruno features to Rocket parity status with evidence"
```

### Task 5: Consistency and quality pass

**Files:**
- Modify: `docs/bruno-feature-inventory.md`
- Modify: `docs/bruno-vs-rocket-parity-matrix.md`

**Step 1: Cross-check feature names between docs**
Ensure no feature appears in matrix but not inventory (or vice versa).

**Step 2: Verify count consistency**
Inventory total should match number of unique matrix features.

**Step 3: Run markdown sanity checks**
Run: `rg -n "TODO|TBD|\[\]" docs/bruno-feature-inventory.md docs/bruno-vs-rocket-parity-matrix.md`
Expected: no placeholders.

**Step 4: Final docs commit**
```bash
git add docs/bruno-feature-inventory.md docs/bruno-vs-rocket-parity-matrix.md
git commit -m "docs: finalize Bruno inventory and Rocket parity matrix"
```

### Task 6: Final verification

**Files:**
- Verify: `docs/bruno-feature-inventory.md`
- Verify: `docs/bruno-vs-rocket-parity-matrix.md`

**Step 1: Validate readability and structure**
Run: `wc -l docs/bruno-feature-inventory.md docs/bruno-vs-rocket-parity-matrix.md`
Expected: complete but concise docs.

**Step 2: Confirm git status clean for intended files**
Run: `git status --short`
Expected: only intentional uncommitted files, if any.

