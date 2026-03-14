● Frontend Audit & Feature Gap Analysis

  Part 1: Modern Web Standards Compliance

  CRITICAL Issues (5)

  ┌─────┬────────────────────────────────────┬────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────┐
  │  #  │               Issue                │                            Location                            │                            Impact                            │
  ├─────┼────────────────────────────────────┼────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ 1   │ No Error Boundary                  │ App-wide — no ErrorBoundary component exists                   │ Unhandled component error crashes entire app to white screen │
  ├─────┼────────────────────────────────────┼────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ 2   │ Missing aria-labels on form inputs │ RequestBuilderTabs.tsx — 20+ inputs lack <label> or aria-label │ WCAG 2.1 Level A violation                                   │
  ├─────┼────────────────────────────────────┼────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ 3   │ No skip navigation link            │ WorkspaceShell.tsx header                                      │ WCAG 2.1 Level A violation                                   │
  ├─────┼────────────────────────────────────┼────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ 4   │ Collection tree not virtualized    │ CollectionsSidebar.tsx:610-722                                 │ 100+ request collections will cause DOM bloat                │
  ├─────┼────────────────────────────────────┼────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ 5   │ No lazy route loading              │ AppRouter.tsx — Suspense exists but routes aren't lazy         │ Entire bundle loads upfront                                  │
  └─────┴────────────────────────────────────┴────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────┘

  IMPORTANT Issues (11)

  ┌─────┬─────────────────────────────────────┬──────────────────────────────────────────────────────────────────┐
  │  #  │                Issue                │                             Details                              │
  ├─────┼─────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 6   │ Tree missing ARIA semantics         │ No role="tree" / role="treeitem" on collection nodes             │
  ├─────┼─────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 7   │ No skeleton loaders                 │ Only spinners — causes layout shift, worse perceived performance │
  ├─────┼─────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 8   │ Sidebar not responsive              │ Fixed width, no collapse/hide on mobile screens                  │
  ├─────┼─────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 9   │ Limited responsive breakpoints      │ Only sm: used; no md: / lg: for tablet/desktop                   │
  ├─────┼─────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 10  │ Response panel has no loading state │ No visual indicator while request is in-flight                   │
  ├─────┼─────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 11  │ No CSP configured                   │ No Content-Security-Policy meta tag in index.html                │
  ├─────┼─────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 12  │ Color contrast in status badges     │ bg-blue-100 text-blue-700 may not meet WCAG AA 4.5:1             │
  ├─────┼─────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 13  │ Error messages not announced        │ Error div missing role="alert" for screen readers                │
  ├─────┼─────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 14  │ Tree keyboard navigation incomplete │ No arrow key support, no Home/End navigation                     │
  ├─────┼─────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 15  │ No PWA support                      │ No service worker, no web manifest                               │
  ├─────┼─────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 16  │ No i18n framework                   │ All strings hardcoded in English                                 │
  └─────┴─────────────────────────────────────┴──────────────────────────────────────────────────────────────────┘

  What's Already Good

  - No dangerouslySetInnerHTML — no XSS vectors
  - TypeScript strict mode enabled
  - focus-visible rings on all buttons (shadcn/ui)
  - Form submission on Enter key
  - <html lang="en"> set
  - alt text on images
  - useMemo used appropriately in response panel
  - 97 tests across 23 test files, no skipped tests

  ---
  Part 2: Feature Gap vs Postman & Bruno

  What Rocket Already Has

  HTTP methods (all 7), JSON/form-data/raw/binary bodies, Basic/Bearer/API Key auth, pre/post scripts with pm.test(), environment + collection variables with {{var}} substitution,
  collections with folders, multi-tab editing, import/export (Postman + Bruno + cURL), cookie management, real-time WebSocket sync, git-based .bru storage, Monaco editor, request
  history, templates, and console.

  Critical Missing Features

  ┌──────────┬────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────┐
  │ Priority │                    Feature                     │                                    Impact                                     │
  ├──────────┼────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
  │ P1       │ OAuth 2.0 authentication                       │ Cannot use Rocket against majority of modern APIs                             │
  ├──────────┼────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
  │ P1       │ Code snippet generation (cURL, Python, JS, Go) │ Daily-use feature in Postman — developers constantly export requests          │
  ├──────────┼────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
  │ P1       │ Collection runner with request chaining        │ Button exists but is disabled. Unlocks API test automation                    │
  ├──────────┼────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
  │ P1       │ x-www-form-urlencoded body type                │ Missing from body selector — needed for OAuth token endpoints and legacy APIs │
  ├──────────┼────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
  │ P2       │ OpenAPI/Swagger import                         │ Many teams start from API specs                                               │
  ├──────────┼────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
  │ P2       │ GraphQL support                                │ No dedicated GraphQL mode, no schema introspection                            │
  ├──────────┼────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
  │ P2       │ Global variables                               │ No cross-collection variable scope                                            │
  ├──────────┼────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
  │ P2       │ Proxy settings                                 │ Required for corporate environments                                           │
  ├──────────┼────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
  │ P2       │ Client certificate management                  │ Required for mTLS APIs                                                        │
  ├──────────┼────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
  │ P2       │ Request duplication                            │ No "duplicate" action in context menu                                         │
  └──────────┴────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────┘

  Quick Wins (small effort, high value)

  1. x-www-form-urlencoded — small UI addition to body type selector
  2. Duplicate request context menu item — straightforward
  3. cURL export — reverse of the existing parser

  ---
  Recommended Action Plan

  Phase 1 — Standards & Safety (immediate):
  Add Error Boundary, aria-labels on inputs, role="alert" on error messages, skip navigation link

  Phase 2 — Critical Feature Gaps:
  OAuth 2.0 auth, x-www-form-urlencoded body, code snippet generation, collection runner

  Phase 3 — UX & Performance:
  Skeleton loaders, responsive sidebar, tree virtualization, keyboard navigation