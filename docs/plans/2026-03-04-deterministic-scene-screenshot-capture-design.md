# Deterministic Scene Screenshot Capture Design

## Problem
Current screenshot automation captures multiple files from nearly identical UI state, so many images appear visually the same. Theme switching can also race without explicit DOM-state confirmation.

## Goal
Generate unique, feature-representative screenshots for each manifest scene (`01`-`18`) in both Light and Dark themes, using deterministic demo data.

## Approved Direction
1. Seed a dedicated demo collection (`manual-demo`) via backend API before capture.
2. Drive the UI into explicit per-scene states before each screenshot.
3. Wait for theme class confirmation before each themed capture.
4. Preserve current filenames and output paths.

## Data Seeding Plan
- Remove existing `manual-demo` if present.
- Create collection `manual-demo`.
- Create folders and requests:
  - `Users/List Users (GET)`
  - `Users/Create User (POST)`
  - `Auth/Login (POST)`
- Save request bodies/URLs including variables (`{{baseUrl}}`).
- Seed collection variables and one environment (`dev`).

## Scene Orchestration
- `01`: workspace overview (default)
- `02`: expanded collections tree
- `03`: two request tabs open
- `04`: URL-focused request view with variable URL
- `05`: body tab visible for POST request
- `06`: collection overview variables tab
- `07`: environment dialog opened from request header settings
- `08`: response panel visible after send
- `09`: history tab open
- `10`: templates dialog open
- `11`: cookies dialog open
- `12`: status bar actions focus shot
- `13`-`18`: admin/developer evidence screens (API health / operational context pages)

## Validation
- Light/dark images for each scene differ by theme.
- Scene files are visually distinct by feature intent.
- Output count: 18 light + 18 dark.
