# MarketPilot Issue 031 Scroll-Contained Shell Verification

## Automated Coverage Added

- Extended `testcases/authenticated-shell-layout.test.ts` at the authenticated shell seam.
- Coverage now checks that desktop sidebar navigation, mobile tab navigation, and URL-backed view changes share `navigateToView`.
- Coverage checks that top-level view changes are the reset path for `authenticated-shell-scroll-container`.
- Coverage checks that Add Trade, completed-trade edit, Trade Log search/filter/sort, trade detail selection, and delete dialog state changes stay on local non-reset paths.
- Coverage checks that the trade detail drawer and delete dialog keep fixed overlay layering and their own scroll containers.
- Existing coverage already checked the viewport-confined shell, pinned mobile tabs, short-viewport sidebar reachability via sidebar overflow, focus reveal behavior, and absence of focus-trap markers.

## Manual Regression Checklist

The current repo test setup is Vitest-only and does not include Playwright, Cypress, Testing Library, jsdom, or happy-dom. Exact pinned-chrome layout behavior still needs browser verification.

- Desktop long content: open Dashboard, Trade Log, Journal, Playbooks, Analytics, and Settings with enough data to overflow; scroll the content panel and confirm the sidebar and top bar remain pinned.
- Mobile or tablet long content: use a mobile/tablet viewport; scroll long content and confirm the top bar and mobile tab navigation remain visible while only the active panel scrolls.
- Short desktop viewport: use a very short viewport; confirm the sidebar stays pinned and its lower controls remain reachable through sidebar scrolling.
- Top-level reset: scroll down, then switch views from the desktop sidebar and mobile tabs; confirm the next view starts at the top of the shell scroll container.
- URL-driven reset: navigate directly with `?view=trades`, `?view=journal`, `?view=playbooks`, `?view=analytics`, and `?view=settings`; confirm the active view starts at the top.
- Local actions preserve scroll: while scrolled, open Add Trade, edit a completed trade, change Trade Log search, result filter, side filter, and sort; confirm these actions do not unexpectedly jump the content panel.
- Overlays: while scrolled, open the trade detail drawer and delete dialog; confirm they overlay the shell correctly and their internal content remains scrollable where applicable.
- Keyboard behavior: tab from top controls into lower content; confirm focus is brought into view inside the content panel, the document itself does not scroll, and focus can leave controls normally.
