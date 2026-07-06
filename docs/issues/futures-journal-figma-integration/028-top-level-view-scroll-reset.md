## Parent

docs/marketpilot-scroll-contained-shell-prd.md

## What to build

Reset the shell content panel to the top when the trader makes a top-level view change. Sidebar navigation, mobile tab navigation, and URL or query-driven view changes should all start the destination panel at the top so each top-level surface opens predictably.

## Acceptance criteria

- [ ] Switching from Dashboard to Trade Log resets the content panel to the top of Trade Log.
- [ ] Switching from Trade Log to Analytics resets the content panel to the top of Analytics.
- [ ] Switching between any top-level views through desktop sidebar navigation resets only the shell content panel, not the whole document.
- [ ] Switching between any top-level views through mobile tab navigation resets only the shell content panel.
- [ ] URL or query-driven view changes reset the active content panel to the top.
- [ ] The reset behavior is owned by the authenticated shell seam rather than patched independently inside every tab.
- [ ] Tests or a documented verification seam cover top-level view changes without depending on brittle CSS class names.

## Blocked by

- docs/issues/futures-journal-figma-integration/025-authenticated-shell-scroll-container.md
- docs/issues/futures-journal-figma-integration/027-mobile-tablet-pinned-chrome.md
