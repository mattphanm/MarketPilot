## Parent

docs/marketpilot-scroll-contained-shell-prd.md

## What to build

Apply the same shell-owned scrolling behavior to mobile and tablet layouts. The top bar and mobile tab navigation should stay visible together, while only the active Dashboard, Trade Log, Journal, Playbooks, Analytics, or Settings panel scrolls underneath them.

## Acceptance criteria

- [x] On mobile widths, the top bar remains visible while long active-view content scrolls in the panel.
- [x] On mobile widths, tab navigation remains pinned with the top bar and does not scroll away with active-view content.
- [x] On tablet or intermediate widths, app chrome remains stable and the active panel is the primary scroll surface.
- [x] Mobile tab navigation still supports switching between Dashboard, Trade Log, Journal, Playbooks, Analytics, and Settings.
- [x] Native scrollbar behavior remains discoverable; no hidden scrollbar or custom scrollbar styling is introduced.
- [x] Existing responsive spacing and visual hierarchy are preserved without text overlap.

## Blocked by

- docs/issues/futures-journal-figma-integration/025-authenticated-shell-scroll-container.md
