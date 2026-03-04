# Deterministic Scene Screenshot Capture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make screenshot capture deterministic and scene-specific so each manual image reflects a unique feature state in both themes.

**Architecture:** Extend `scripts/capture-manual-screenshots.sh` embedded Node+Playwright workflow with (a) API seeding, (b) per-scene state functions, and (c) strict theme-state waiting. Keep manual filenames unchanged.

**Tech Stack:** Bash, Node.js, Playwright, Rocket backend REST API.

---

### Task 1: Add deterministic API seeding for `manual-demo`

**Files:**
- Modify: `scripts/capture-manual-screenshots.sh`

**Step 1: Write minimal implementation**
- Add helper to call backend API.
- Delete existing `manual-demo` if present, then recreate.
- Seed folders, requests, collection variables, environment.

**Step 2: Verify**
- Run capture script and confirm seed API calls complete.

### Task 2: Implement scene-by-scene UI automation

**Files:**
- Modify: `scripts/capture-manual-screenshots.sh`

**Step 1: Write minimal implementation**
- Add scene handlers that navigate to explicit UI states before screenshot.
- Ensure scenes `01`-`12` map to user features.
- Add distinct admin evidence screens for `13`-`18`.

**Step 2: Verify**
- Confirm visually distinct outputs for 18 scenes.

### Task 3: Harden theme switching

**Files:**
- Modify: `scripts/capture-manual-screenshots.sh`

**Step 1: Write minimal implementation**
- Wait for `<html>` dark class match/non-match after reload.
- Add small stabilization wait before capture.

**Step 2: Verify**
- Check light/dark hash differences for each scene pair.

### Task 4: End-to-end verification

**Files:**
- No new files

**Step 1: Run capture and checks**
- `./scripts/capture-manual-screenshots.sh --url http://127.0.0.1:5174`
- Validate 18 files each in light/dark folders.
- Validate no identical light/dark pairs.

**Step 2: Commit**
```bash
git add scripts/capture-manual-screenshots.sh docs/plans/2026-03-04-deterministic-scene-screenshot-capture-design.md docs/plans/2026-03-04-deterministic-scene-screenshot-capture.md
git commit -m "feat(docs): make screenshot capture deterministic with scene automation"
```
