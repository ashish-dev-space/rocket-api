# User And Admin Manual With Screenshot Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship user and admin/developer manuals with Light/Dark screenshot coverage and annotation-ready workflow.

**Architecture:** Keep docs in Markdown under `docs/` and assets under `docs/manual-assets/`. Add lightweight screenshot workflow artifacts (manifest + command scaffolding) without heavy test infra changes.

**Tech Stack:** Markdown, repository shell scripts, existing frontend/backend run commands.

---

### Task 1: Create manual asset structure and screenshot manifest

**Files:**
- Create: `docs/manual-assets/README.md`
- Create: `docs/manual-assets/screenshots/light/.gitkeep`
- Create: `docs/manual-assets/screenshots/dark/.gitkeep`
- Create: `docs/manual-assets/annotated/.gitkeep`
- Create: `docs/manual-assets/screenshot-manifest.md`

**Step 1: Write minimal implementation**
- Define naming conventions and annotation callout format.
- Define feature-by-feature screenshot list for both themes.

**Step 2: Verify**
- Ensure all referenced paths exist.

**Step 3: Commit**
```bash
git add docs/manual-assets
git commit -m "docs(manual): add screenshot asset structure and capture manifest"
```

### Task 2: Draft end-user manual

**Files:**
- Create: `docs/user-manual.md`

**Step 1: Write minimal implementation**
- Document all major end-user workflows and supported features.
- Include screenshot slots and annotation callout bullets.
- Add Light/Dark screenshot references where applicable.

**Step 2: Verify**
- Cross-check feature statements against current app behavior.

**Step 3: Commit**
```bash
git add docs/user-manual.md
git commit -m "docs(manual): add end-user manual with screenshot callouts"
```

### Task 3: Draft admin/developer manual

**Files:**
- Create: `docs/admin-developer-manual.md`

**Step 1: Write minimal implementation**
- Add prerequisites, install/run commands, config notes, and dev workflows.
- Include operational troubleshooting and validation checklist.
- Reference screenshot sections for setup and runtime UI checks.

**Step 2: Verify**
- Validate commands against current scripts in repo.

**Step 3: Commit**
```bash
git add docs/admin-developer-manual.md
git commit -m "docs(manual): add admin and developer operations manual"
```

### Task 4: Add screenshot capture script scaffold and usage

**Files:**
- Create: `scripts/capture-manual-screenshots.sh`
- Modify: `README.md`

**Step 1: Write minimal implementation**
- Add script scaffold with deterministic output directories and naming guidance.
- Include clear TODO hooks for browser automation/manual fallback.
- Document execution flow in root README.

**Step 2: Verify**
- `chmod +x` script and run a dry check mode.

**Step 3: Commit**
```bash
git add scripts/capture-manual-screenshots.sh README.md
git commit -m "docs(manual): add screenshot capture workflow scaffold"
```

### Task 5: Validate docs quality and links

**Files:**
- Modify: `docs/user-manual.md`
- Modify: `docs/admin-developer-manual.md`
- Modify: `docs/manual-assets/screenshot-manifest.md`

**Step 1: Verification commands**
Run:
- `cd frontend && yarn -s lint`
- `cd frontend && yarn -s test`

**Step 2: Manual verification**
- Ensure all Markdown image links and paths resolve.
- Ensure no stale commands or mismatched ports.

**Step 3: Final commit**
```bash
git add docs/user-manual.md docs/admin-developer-manual.md docs/manual-assets/screenshot-manifest.md
git commit -m "docs(manual): finalize manuals and screenshot coverage map"
```
