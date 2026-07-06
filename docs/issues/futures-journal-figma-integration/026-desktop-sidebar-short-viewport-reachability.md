## Parent

docs/marketpilot-scroll-contained-shell-prd.md

## What to build

Make the desktop sidebar behave correctly inside the viewport-contained shell, including short desktop viewports. The sidebar should remain pinned while the active content panel scrolls, and any sidebar controls that would otherwise be clipped on a short screen must remain reachable through the sidebar's own internal scrolling.

## Acceptance criteria

- [ ] On desktop widths, the sidebar remains pinned for the full viewport height while long Dashboard, Trade Log, Journal, Playbooks, Analytics, and Settings content scrolls in the active panel.
- [ ] On short desktop viewports, sidebar navigation and account controls remain reachable without causing the whole document to scroll.
- [ ] Sidebar navigation still switches between Dashboard, Trade Log, Journal, Playbooks, Analytics, and Settings with the existing selected state.
- [ ] The Add Trade action remains usable from the sidebar.
- [ ] Sidebar visual structure, spacing, and labels remain consistent with the current MarketPilot shell.

## Blocked by

- docs/issues/futures-journal-figma-integration/025-authenticated-shell-scroll-container.md
