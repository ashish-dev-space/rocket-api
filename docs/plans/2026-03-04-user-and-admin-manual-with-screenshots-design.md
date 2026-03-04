# User And Admin Manual With Screenshot Workflow Design

## Objective
Create two manuals for Rocket:
- End-user manual explaining supported features and usage.
- Admin/developer manual covering install, config, backend/frontend run, and maintenance workflows.

Both manuals must include screenshot coverage for Light and Dark themes and support annotated images.

## Approved Approach
Use approach 1:
- Markdown manuals as the source of truth.
- Automated screenshot capture workflow for baseline images.
- Annotation-ready image paths and a caption/callout convention integrated into docs.

## Deliverables
1. `docs/user-manual.md`
2. `docs/admin-developer-manual.md`
3. `docs/manual-assets/` structure for light/dark screenshots and annotated outputs
4. Screenshot capture tooling scaffold and command documentation
5. Screenshot manifest/checklist mapping sections to required captures

## Information Architecture
### User Manual
- Product overview and key concepts
- UI layout tour (sidebar, tabs, request builder, status bar)
- Collections, folders, requests workflows
- Request authoring (method/url/headers/query/body/auth)
- Environments and collection variables
- Send + response analysis
- History, templates, cookies
- Common troubleshooting and FAQ

### Admin/Developer Manual
- Local prerequisites and install
- Frontend + backend run steps
- Config and environment assumptions
- Collection storage format and directory conventions
- Quality workflows (`lint`, `test`, `build`)
- Debugging playbook and operational checks
- Release/readiness checklist

## Screenshot Strategy
- Capture baseline screenshots for each key flow in both themes.
- Store raw captures under:
  - `docs/manual-assets/screenshots/light/`
  - `docs/manual-assets/screenshots/dark/`
- Store annotated final images under:
  - `docs/manual-assets/annotated/`
- Manuals reference annotated images when available, else baseline image with TODO callout marker.

## Annotation Convention
- File naming: `NN-topic-light.png`, `NN-topic-dark.png`, and `NN-topic-annotated.png`
- Each screenshot section includes:
  - title
  - short context sentence
  - callout bullets (`A`, `B`, `C`) matching annotation labels

## Risks and Mitigations
- Risk: Automated browser capture tooling not yet present in repo.
  - Mitigation: add scaffolded script and usage contract; keep manual compatible with manual capture fallback.
- Risk: UI drift after future redesigns.
  - Mitigation: screenshot manifest with deterministic names and refresh checklist.

## Validation Criteria
- Both manuals are complete and readable standalone.
- Light and Dark screenshot coverage checklist exists for major features.
- Screenshot/annotation file structure is present and referenced consistently.
- Setup/run instructions are executable from a clean checkout.
