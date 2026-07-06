## Parent

docs/marketpilot-scroll-contained-shell-prd.md

## What to build

Add the final verification coverage for the scroll-contained authenticated shell. Prefer an automated browser or component-level regression check if the current test setup can support layout behavior cheaply; otherwise, document a clear manual checklist in the implementation handoff or PR notes so desktop, mobile, short viewport, overlay, and keyboard behavior can be reviewed consistently.

## Acceptance criteria

- [ ] Verification covers desktop long content with pinned sidebar and top bar.
- [ ] Verification covers mobile or tablet long content with pinned top bar and mobile tab navigation.
- [ ] Verification covers very short desktop viewport behavior and sidebar control reachability.
- [ ] Verification covers top-level navigation reset from desktop sidebar, mobile tabs, and URL or query-driven view changes.
- [ ] Verification covers Add Trade, completed-Trade edit, Trade Log search/filter/sort, trade detail drawer, delete dialog, and existing drawer or modal scrolling.
- [ ] Verification covers keyboard tabbing into lower content without document scroll or focus traps.
- [ ] If automated layout checks are practical, a focused regression check is added at the authenticated shell seam.
- [ ] If automated layout checks are not practical, the limitation and manual checklist are documented clearly for reviewers.

## Blocked by

- docs/issues/futures-journal-figma-integration/026-desktop-sidebar-short-viewport-reachability.md
- docs/issues/futures-journal-figma-integration/027-mobile-tablet-pinned-chrome.md
- docs/issues/futures-journal-figma-integration/028-top-level-view-scroll-reset.md
- docs/issues/futures-journal-figma-integration/029-preserve-local-scroll-during-actions-and-overlays.md
- docs/issues/futures-journal-figma-integration/030-keyboard-and-accessibility-scroll-behavior.md
