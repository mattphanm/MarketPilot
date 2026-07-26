# MarketPilot Issue 019 Handoff

Focus for next session: implement and commit `docs/issues/futures-journal-figma-integration/019-responsive-visual-pass.md`. The user explicitly said no visual tests are needed.

## What We Understand

- Repo: `/Users/matthewphan/Documents/Codex-Agentic/Projects/marketpilot`
- Issue: `docs/issues/futures-journal-figma-integration/019-responsive-visual-pass.md`
- Goal: responsive visual pass over the Figma-aligned app shell and the Dashboard, Trade Log, drawer/modal flows, Playbooks, Analytics, Journal, and Settings.
- Acceptance criteria mention Playwright screenshots, but the user overrode that with "No visual tests needed".
- AGENTS.md says this is Next.js 16 with breaking changes, so read relevant local docs under `node_modules/next/dist/docs/` before coding. I read `node_modules/next/dist/docs/01-app/index.md`.
- The app is primarily in `app/components/trade-journal.tsx`, rendered from `app/page.tsx`.

## Implemented So Far

- No code changes were applied.
- No tests were run.
- No commit was made.
- I inspected:
  - `docs/issues/futures-journal-figma-integration/019-responsive-visual-pass.md`
  - `package.json`
  - `app/page.tsx`
  - `app/components/trade-journal.tsx`
  - `app/globals.css`
  - `node_modules/next/dist/docs/01-app/index.md`

## Findings

- The likely implementation surface is `app/components/trade-journal.tsx`.
- Layout risk areas found during inspection:
  - Root shell can allow horizontal overflow on narrow screens unless main/root containers are constrained.
  - `TopBar` controls can crowd on mobile/tablet.
  - `TradeDetailDrawer` uses a fixed right drawer and rigid grids that can squeeze at small widths.
  - `DeleteTradeDialog` and Playbook modal should be constrained to viewport height and scroll internally.
  - `PlaybooksView` cards use fixed four-column metric grids and horizontal best/worst pills that can crowd.
  - `JournalReviewView` has fixed desktop grid widths and side facts that need graceful wrapping.
  - `TradeFormView` has two-column fields that may need single-column behavior on narrow screens.
  - Several tables already use horizontal scrolling and min widths; those likely can stay.

## Left To Do

1. Patch responsive classes in `app/components/trade-journal.tsx`, keeping behavior unchanged.
2. Consider adding global `overflow-x-hidden` or equivalent root containment in `app/globals.css`, if needed.
3. Run `npm run lint`.
4. Run `npm run build` or at least `npx tsc --noEmit` if build is too heavy.
5. Review `git diff`.
6. Commit the implementation. A reasonable message: `Improve responsive journal layouts`.

## Suggested Skills

- `mattpocock-skills:implement` for completing and committing the issue.
- Do not use visual-test tooling unless the user changes their instruction.

## Current Git Notes

- At interruption time, `git status --short` showed two untracked files unrelated to this issue:
  - `docs/handoffs/futures-journal/issue-014-playbook-performance.md`
  - `docs/issues/futures-journal-figma-integration/marketpilot-issue-017-handoff.md`
- Leave those untouched unless the user explicitly asks otherwise.
