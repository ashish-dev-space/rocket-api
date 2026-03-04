# Manual Assets

This directory stores screenshot assets used by the Rocket manuals.

## Structure

- `screenshots/light/`: Raw Light-theme captures
- `screenshots/dark/`: Raw Dark-theme captures
- `annotated/`: Final annotated screenshots used in manuals
- `screenshot-manifest.md`: Capture checklist and naming map

## Naming convention

Use deterministic names so manual references remain stable:

- Raw: `NN-topic-light.png`, `NN-topic-dark.png`
- Annotated: `NN-topic-annotated.png`

Example:

- `01-workspace-overview-light.png`
- `01-workspace-overview-dark.png`
- `01-workspace-overview-annotated.png`

## Annotation convention

Manuals use callout bullets (`A`, `B`, `C`, ...) mapped to labels drawn on annotated images.
