# MarketPilot Scroll-Contained Shell Handoff

## Context

The user reported that scrolling down on authenticated app pages moves the sidebar/tab navigation along with the page content. They want scrolling to move only the data/content panel, while the app chrome remains fixed.

This was handled as a grill/design session, not implementation. No code changes have been made for the scroll behavior yet.

Relevant repo context:

- App shell and dashboard UI: `app/components/trade-journal.tsx`
- Authenticated entry point: `app/page.tsx`
- Global CSS: `app/globals.css`
- Repo instruction: read relevant `node_modules/next/dist/docs/` guidance before writing Next.js code.

Observed implementation shape:

- `TradeJournal` renders the authenticated app shell near the bottom of `app/components/trade-journal.tsx`.
- Current root shell uses `min-h-screen overflow-x-hidden bg-[#F7F8FA] text-[#171923] lg:flex`.
- Desktop `Sidebar` currently renders as an in-flow `<aside>` with `hidden min-h-screen ... lg:flex`.
- `<main>` already has `overflow-hidden`, and the content wrapper already has `min-h-0 flex-1 overflow-y-auto`, but because the outer shell is `min-h-screen` instead of viewport-confined, the document itself can still scroll.
- `TopBar` and `MobileNav` are rendered inside `main` before the content wrapper.
- Existing drawers/modals already use fixed positioning and internal scroll containers.

## Decisions Reached

Implement the recommended behavior:

- Apply scroll containment only to the authenticated dashboard shell.
- Preserve the sign-in screen's normal page scrolling behavior.
- Desktop sidebar should remain fixed/pinned while the user scrolls content.
- Top bar should also remain fixed/pinned while content scrolls.
- On mobile, keep the top bar and tab bar pinned together while the data panel scrolls.
- Only the main data/content panel should scroll.
- Leave the browser scrollbar visible; do not hide or custom-style it.
- Preserve current visual spacing and layout as much as possible. This is a targeted shell behavior change, not a redesign.
- When switching top-level views/tabs, reset the main data panel scroll position to the top.
- Reset-to-top should apply consistently for sidebar navigation, mobile tabs, and URL/query-driven view changes.
- Do not reset scroll when opening Add Trade, editing a trade, changing filters, or opening drawers/dialogs.
- Drawers and modals should keep their current independent scrolling behavior and remain layered above the fixed shell.
- On very short desktop screens, the sidebar should remain pinned but allow its own internal area to scroll if needed so controls remain reachable.
- Keyboard focus should naturally scroll the main data panel to focused content while sidebar/top bar remain fixed. Verify no focus trap is introduced.
- Add a focused regression check if the existing test setup supports it cheaply; otherwise do manual verification and document the test limitation.

## Suggested Implementation Direction

Likely implementation target: `app/components/trade-journal.tsx`.

Expected changes:

- Change the authenticated shell from document-height layout to viewport-confined layout, likely `h-screen`/`max-h-screen` plus `overflow-hidden`.
- Ensure the desktop `Sidebar` uses viewport height, e.g. `h-screen`, not `min-h-screen`.
- Ensure `main` is height-constrained with `min-h-0` and `h-screen` or equivalent so the existing content wrapper's `overflow-y-auto` is the only primary scroll surface.
- Keep `TopBar` and `MobileNav` outside the scrolling content wrapper.
- Add a `ref` to the content scroll container and reset `scrollTop = 0` when `activeView` changes.
- Avoid resetting scroll in handlers for forms, drawers, filters, sorting, or edits.

Implementation needs to be checked against current Tailwind/Next version behavior. Per `AGENTS.md`, read relevant docs under `node_modules/next/dist/docs/` before making code changes.

## Suggested Skills

- `grilling`: Already used to settle behavior and edge cases.
- `mattpocock-skills:tdd` or `tdd`: Use if adding a browser-level or component-level regression check.
- `diagnosing-bugs`: Use if the scroll behavior interacts badly with focus, drawers, or mobile viewport sizing.

## Verification Checklist

- Desktop: scrolling long Dashboard/Analytics/Trade Log content moves only the data panel; sidebar and top bar do not move.
- Mobile/tablet: top bar and tab bar remain visible while content scrolls.
- Switching between top-level views starts the newly opened view at the top.
- Opening Add Trade, editing, filtering, sorting, or opening a trade drawer does not unexpectedly jump the content panel to top.
- Trade detail drawer and delete dialogs still scroll internally and overlay the shell correctly.
- Very short desktop viewport keeps sidebar controls reachable.
- Keyboard tabbing into lower content scrolls the content panel, not the whole document.
- If tests are not added, record that manual verification was used.
