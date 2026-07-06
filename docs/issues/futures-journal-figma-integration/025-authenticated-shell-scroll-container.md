## Parent

docs/marketpilot-scroll-contained-shell-prd.md

## What to build

Constrain the authenticated MarketPilot app shell to the viewport so the sidebar and top bar stay pinned while the active view content scrolls inside one shell-owned panel. The sign-in and unauthenticated screens must keep normal document scrolling. This slice establishes the shared scroll seam that later slices use for mobile behavior, view-change reset behavior, and regression checks.

## Acceptance criteria

- [ ] Authenticated Dashboard, Trade Log, Journal, Playbooks, Analytics, and Settings render inside a single height-constrained content panel.
- [ ] Scrolling long authenticated content does not move the desktop sidebar or top bar.
- [ ] The document itself does not become the primary scroll surface for authenticated app content.
- [ ] The browser scrollbar remains visible; no hidden or custom scrollbar treatment is introduced.
- [ ] The sign-in and unauthenticated screens keep normal document scrolling and are not constrained by the authenticated shell.
- [ ] Current app shell spacing, colors, navigation labels, and top bar hierarchy are preserved aside from the scroll containment behavior.
- [ ] No schema changes, route changes, persistence changes, API contracts, or domain entities are introduced.

## Blocked by

None - can start immediately
