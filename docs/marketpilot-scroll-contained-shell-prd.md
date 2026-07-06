# PRD: Scroll-Contained Authenticated App Shell

## Problem Statement

MarketPilot authenticated app pages currently allow the document itself to scroll. When a trader scrolls long dashboard, analytics, or Trade Log content, the sidebar and top navigation move with the page. This makes the app chrome feel unstable and forces the trader to scroll back to reach primary navigation or top-level actions.

The desired behavior is for the authenticated futures journal shell to stay pinned while only the active data/content panel scrolls. The sign-in screen should keep normal page scrolling.

## Solution

Constrain the authenticated app shell to the viewport and make the main content panel the only primary scroll surface. On desktop, the sidebar and top bar remain pinned while Dashboard, Trade Log, Journal, Playbooks, Analytics, and Settings content scrolls inside the central panel. On mobile and tablet, the top bar and tab navigation remain visible together while the active panel scrolls.

When the trader switches top-level views, the content panel resets to the top so each destination starts predictably. Opening modals, drawers, filters, sorting controls, add/edit flows, and detail surfaces should not reset the content scroll position.

## User Stories

1. As a futures trader, I want the sidebar to stay visible while I scroll page content, so that I can switch between Dashboard, Trade Log, Journal, Playbooks, Analytics, and Settings without scrolling back up.
2. As a futures trader, I want the top bar to stay visible while I scroll content, so that page context and top-level controls remain available.
3. As a futures trader, I want only the active data/content panel to scroll, so that app navigation remains stable.
4. As a futures trader, I want the sign-in screen to keep normal page scrolling, so that unauthenticated pages are not constrained by dashboard shell behavior.
5. As a desktop user, I want the sidebar pinned to the viewport, so that primary navigation never leaves the screen during content review.
6. As a desktop user on a short screen, I want sidebar controls to remain reachable, so that viewport containment does not hide navigation or actions.
7. As a mobile user, I want the top bar and tab navigation pinned together, so that I can change views without returning to the top of long content.
8. As a tablet user, I want the app chrome to stay fixed while the panel scrolls, so that the layout behaves consistently across intermediate widths.
9. As a futures trader, I want the browser scrollbar to remain visible, so that scrolling behavior is familiar and discoverable.
10. As a futures trader, I want current spacing and visual hierarchy preserved, so that this feels like a targeted behavior fix rather than a redesign.
11. As a futures trader, I want Dashboard content to scroll inside the panel, so that metrics and charts can be reviewed without moving the shell.
12. As a futures trader, I want Analytics content to scroll inside the panel, so that longer analysis sections do not move navigation.
13. As a futures trader, I want Trade Log content to scroll inside the panel, so that dense completed trade history stays inside the app frame.
14. As a futures trader, I want Journal content to scroll inside the panel, so that review lists and detail content do not move the shell.
15. As a futures trader, I want Playbooks content to scroll inside the panel, so that playbook definitions and performance can be reviewed with navigation visible.
16. As a futures trader, I want Settings content to scroll inside the panel, so that account and workspace sections stay within the same shell behavior.
17. As a futures trader, I want switching from Dashboard to Trade Log to start Trade Log at the top, so that each top-level view opens from a predictable position.
18. As a futures trader, I want switching from Trade Log to Analytics to start Analytics at the top, so that previous scroll depth does not carry into a different surface.
19. As a futures trader, I want mobile tab changes to reset the active content panel to the top, so that mobile navigation has the same predictable behavior as desktop navigation.
20. As a futures trader, I want URL or query-driven view changes to reset the content panel to the top, so that direct navigation behaves like clicking a tab.
21. As a futures trader, I do not want opening Add Trade to reset my current scroll position, so that I can return to the same context after closing it.
22. As a futures trader, I do not want editing a completed Trade to reset my current scroll position, so that edits do not disrupt review context.
23. As a futures trader, I do not want changing Trade Log search, filters, or sorting to jump to the top, so that local list refinement does not disorient me.
24. As a futures trader, I do not want opening a trade detail drawer to reset the content panel, so that inspection remains anchored to the selected row.
25. As a futures trader, I want drawers and dialogs to keep their current independent scrolling, so that long drawer or modal content remains usable above the shell.
26. As a futures trader, I want delete dialogs to continue overlaying the shell correctly, so that fixed shell changes do not break destructive-action confirmation.
27. As a keyboard user, I want tabbing into lower content to scroll the content panel naturally, so that focused controls are brought into view.
28. As a keyboard user, I want focus movement not to scroll the entire document, so that the fixed shell remains stable.
29. As an assistive-technology user, I want no new focus trap introduced by scroll containment, so that existing navigation and dialogs remain operable.
30. As a product maintainer, I want scroll containment scoped to the authenticated shell, so that unrelated public or auth screens are not affected.
31. As a product maintainer, I want the change to preserve current drawer and modal layering, so that existing overlay behavior does not regress.
32. As a developer, I want one app-shell scroll seam, so that scroll behavior is not patched independently inside every tab.
33. As a developer, I want top-level view changes to be the only reset trigger, so that unrelated state changes cannot accidentally jump the content panel.
34. As a QA reviewer, I want a clear manual verification checklist for desktop, mobile, short viewport, overlay, and keyboard behavior, so that this layout fix can be validated consistently.

## Implementation Decisions

- Apply scroll containment only to the authenticated MarketPilot app shell.
- Preserve normal document scrolling for the sign-in and unauthenticated screens.
- Convert the authenticated shell from document-height layout to viewport-confined layout.
- Keep the desktop sidebar pinned for the full viewport height.
- Allow the desktop sidebar's own internal area to scroll on very short screens if its controls would otherwise be unreachable.
- Keep the top bar outside the main scrolling content panel.
- Keep mobile tab navigation outside the main scrolling content panel so it remains pinned with the top bar.
- Keep the active view content in a single height-constrained scroll container.
- Preserve current app shell spacing, colors, and visual structure as much as possible.
- Leave the browser scrollbar visible; do not hide or custom-style scrollbars as part of this work.
- Add a scroll-container reference or equivalent shell-level mechanism to reset the panel to the top when the active top-level view changes.
- Treat sidebar navigation, mobile tab navigation, and URL or query-driven view changes as top-level view changes that reset panel scroll.
- Do not reset panel scroll when opening Add Trade, editing a completed Trade, changing Trade Log filters, changing Trade Log sorting, opening a trade detail drawer, or opening dialogs.
- Preserve existing drawer and modal fixed positioning, internal scrolling, and overlay layering.
- Preserve keyboard focus behavior so focused controls inside the content panel scroll into view without moving the shell.
- Do not introduce schema changes, route changes, persistence changes, or new domain entities.
- Do not redesign navigation, tab names, Entry-Time Range behavior, Trade Log behavior, Journal behavior, Playbook behavior, Analytics calculations, or Settings content.

## Testing Decisions

- Good tests should verify user-visible scroll behavior and reset behavior, not implementation details such as CSS class names or local state names.
- The highest-value seam is the authenticated app shell, because it owns the relationship between fixed chrome, top-level navigation, and the active content panel.
- If the existing test setup supports browser or component-level layout checks cheaply, add a focused regression check showing that scrolling long authenticated content does not move the sidebar or top bar.
- If browser-level layout checks are not practical in the current setup, use manual verification for scroll containment and document the limitation in the implementation handoff or PR notes.
- Add or reuse a behavioral seam for top-level view changes if one exists, verifying that changing active views resets the content panel to the top.
- Do not add brittle tests that assert exact pixel spacing unless the existing UI test strategy already relies on screenshot or layout assertions.
- Manual verification should cover desktop long content, mobile or tablet long content, very short desktop viewports, top-level navigation reset, Add Trade, edit flow, Trade Log filters and sorting, trade detail drawer, delete dialog, and keyboard tabbing into lower content.
- Prior art in the repo includes feature issue checklists and implementation handoffs; if no automated UI harness is available, a documented manual checklist is acceptable for this targeted shell behavior change.

## Out of Scope

- Redesigning the app shell, sidebar, top bar, mobile navigation, or tab visuals.
- Hiding, replacing, or custom-styling native scrollbars.
- Changing the sign-in screen layout.
- Changing the MarketPilot domain model for Trade, Trade Journal, Journal Entry, Playbook, Entry Time, Entry-Time Range, R Multiple, Risk Dollars, or Realized P&L.
- Changing Dashboard, Trade Log, Journal, Playbooks, Analytics, or Settings content beyond the shell containment needed for scrolling.
- Changing Trade Log search, filtering, sorting, or detail drawer behavior except to preserve their scroll position semantics.
- Changing drawer, modal, or dialog content and flows.
- Adding import, broker sync, export, notification, or global search behavior.
- Adding new API contracts or persistence behavior.

## Further Notes

- The implementation target is expected to be the authenticated trade journal shell.
- Per repo instructions, implementation agents must read the relevant Next.js guidance in `node_modules/next/dist/docs/` before writing Next.js code.
- This PRD is based on `docs/handoffs/marketpilot-scroll-contained-shell-handoff-20260705-213636.md`.
- The agreed testing seam is the authenticated shell. Existing seams should be preferred; a new seam should only be introduced if there is no practical way to verify panel scrolling and view-change reset behavior through the shell.
