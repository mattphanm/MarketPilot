## Parent

docs/marketpilot-scroll-contained-shell-prd.md

## What to build

Preserve the trader's current content-panel scroll position when they perform local actions that should not count as top-level navigation. Add Trade, editing a completed Trade, Trade Log search/filter/sort changes, trade detail drawer inspection, delete confirmation, and existing drawer or dialog surfaces should continue to feel anchored to the current review context.

## Acceptance criteria

- [ ] Opening Add Trade does not reset the current content-panel scroll position as a side effect of opening the form.
- [ ] Editing a completed Trade does not reset the current content-panel scroll position as a side effect of opening the edit flow.
- [ ] Changing Trade Log search, result filters, direction filters, or sorting does not jump the content panel to the top.
- [ ] Opening and closing the trade detail drawer preserves the content-panel scroll position.
- [ ] Delete confirmation dialogs continue to overlay the fixed shell correctly.
- [ ] Drawers and dialogs keep their independent internal scrolling for long content.
- [ ] Existing add, edit, delete, filter, sort, and detail workflows keep their current product behavior except for preserving shell scroll position.

## Blocked by

- docs/issues/futures-journal-figma-integration/025-authenticated-shell-scroll-container.md
- docs/issues/futures-journal-figma-integration/028-top-level-view-scroll-reset.md
