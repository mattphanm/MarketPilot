## Parent

docs/marketpilot-scroll-contained-shell-prd.md

## What to build

Ensure keyboard and assistive-technology behavior remains usable after scroll containment. Keyboard focus should bring lower controls into view by scrolling the shell content panel naturally, without moving the full document or introducing new focus traps around the fixed shell.

## Acceptance criteria

- [ ] Tabbing into controls lower in Dashboard, Trade Log, Journal, Playbooks, Analytics, and Settings scrolls the content panel enough to reveal focused controls.
- [ ] Keyboard focus movement does not make the full document scroll while authenticated app chrome is pinned.
- [ ] Sidebar, top bar controls, mobile tabs, active content controls, drawers, and dialogs remain keyboard reachable.
- [ ] No new focus trap is introduced by the fixed shell or content panel.
- [ ] Existing dialog focus behavior continues to work above the fixed shell.
- [ ] Manual or automated verification covers keyboard tabbing into lower content and dialog operation.

## Blocked by

- docs/issues/futures-journal-figma-integration/025-authenticated-shell-scroll-container.md
- docs/issues/futures-journal-figma-integration/029-preserve-local-scroll-during-actions-and-overlays.md
