# MarketPilot Issue 014 Handoff

Next focus: finish `docs/issues/futures-journal-figma-integration/014-playbook-performance-on-playbooks-tab.md`, then commit. User explicitly said: do not visual test; they will do visual testing manually.

## What We Understood

- Issue 014 wants the Playbooks tab to show derived Playbook performance from completed Trades assigned to each Playbook.
- Metrics are not stored on Playbooks.
- Required metrics: win rate, average return/P&L, average R, total trades, best Trade, worst Trade.
- Metrics must update when Trades are created or edited.
- Empty Playbooks need sensible empty states.
- Metrics must include only authenticated user's Trades.
- `app/page.tsx` already queries both `trades` and `playbooks` using `where: { userId }`, so the server-side ownership scope is already in place for the UI.

## What Was Implemented

- Started refactor from local Playbooks tab aggregation into a pure module:
  - Added `lib/playbooks/performance.ts`.
  - Exports `buildPlaybookPerformance(playbooks, trades, options?)`.
  - Calculates assigned trades, win rate, average P&L, average R, total trades, best/worst trade and P&L.
  - Supports optional `userId` filtering for tests/future callers.
- Started wiring `app/components/trade-journal.tsx` to use `buildPlaybookPerformance`.
- Changed `PlaybookSummary` shape to carry typed best/worst trades and nullable averages instead of string/zero placeholders.
- Removed now-unneeded hold-day calculation from Playbook summaries.
- Added helper formatters in `trade-journal.tsx`:
  - `formatSignedRatio`
  - `formatPlaybookTrade`

## Current State / Important Warning

- Work is mid-edit and uncommitted.
- `app/components/trade-journal.tsx` still has stale references to old fields:
  - `avgReturn`
  - `avgRMultiple`
  - string `bestTrade` / `worstTrade`
  - `currentDate` prop passed into `PlaybooksView`
- Because of that, TypeScript/lint likely fails right now.
- Latest observed `git status --short`:
  - `M app/components/trade-journal.tsx`
  - `?? lib/playbooks/performance.ts`

## Left To Do

1. Finish `app/components/trade-journal.tsx` UI wiring:
   - Replace `avgReturn` with `averagePnl`.
   - Replace `avgRMultiple` with `averageRMultiple`.
   - Format average P&L with money formatting, not percent.
   - Format average R with `formatSignedRatio(value) + "R"` or equivalent.
   - Replace best/worst display with `formatPlaybookTrade(trade, pnl)`.
   - Remove `currentDate={currentDate}` from `PlaybooksView` call.
   - Use `null` averages to show `"-"` or `"No trades"` rather than misleading zero.
2. Add focused tests, probably in `testcases/playbooks.test.ts` or a new `testcases/playbook-performance.test.ts`:
   - Derived stats from assigned trades.
   - Empty Playbook returns null averages/win rate and null best/worst.
   - Metrics change when trade values/playbook assignments change.
   - Optional `userId` filter excludes other users' trades.
3. Run non-visual checks only:
   - `npm test -- --run` or targeted Vitest first.
   - `npm run lint`.
   - `npx tsc --noEmit` if available/appropriate.
4. Update issue checkbox states in `docs/issues/futures-journal-figma-integration/014-playbook-performance-on-playbooks-tab.md`.
   - Do not check the visual-test criterion unless user later confirms.
5. Review diff manually.
6. Commit the completed work. Commit is allowed by existing approval prefix.

## Suggested Skills

- `mattpocock-skills:implement` to finish the issue and commit.
- `mattpocock-skills:tdd` if continuing test-first on the pure playbook performance module.

