# MarketPilot Issue 017 Handoff

Next session focus: finish and commit `docs/issues/futures-journal-figma-integration/017-analytics-completed-trade-view.md`. Do not run visual tests; the user will do them manually.

## Suggested Skills

- `mattpocock-skills:implement` for finishing the issue cleanly.
- `mattpocock-skills:tdd` only if adding/changing tests first is useful.

## What We Understand

- Issue path: `docs/issues/futures-journal-figma-integration/017-analytics-completed-trade-view.md`.
- Acceptance criteria: completed-trade-only Analytics tab, date-range filtering by entry time, playbook performance where relevant, no open/planned/partial/live portfolio concepts, visual screenshot skipped by user request.
- Repo instruction: this is Next.js 16.2.6; read relevant local docs under `node_modules/next/dist/docs/` before code changes. I read `01-app/01-getting-started/15-route-handlers.md`.
- Existing analytics already derives P&L from `riskDollars * rMultiple` and uses `openedAt` as the activity date.
- The worktree had an unrelated untracked file before edits: `docs/handoffs/marketpilot-issue-014-handoff.md`. Leave it alone.

## What Was Implemented Before Interruption

Modified files:

- `lib/analytics/report.ts`
- `app/components/trade-journal.tsx`

Changes currently in the worktree:

- Added exported `filterAnalyticsTradesByEntryTime(trades, options)` in `lib/analytics/report.ts`.
- Updated `createAnalyticsReport` to reuse that filter.
- Added Analytics tab custom `start` and `end` date inputs intended to filter metrics by entry time.
- Added custom range state in `TradeJournal`: `analyticsStart`, `analyticsEnd`, plus handlers to clear custom dates when a preset range is selected.
- Updated Analytics copy from “closed trades” to “completed trades” in the score panel.
- Added a Playbook Performance section to Analytics, intended to use the filtered trades.

## Important Current Problem

The interrupted code likely does not compile yet:

- `app/components/trade-journal.tsx` calls `buildPlaybookSummaries(playbooks, analyticsTrades)`.
- Existing helper is named `buildPlaybooks(playbooks, trades)`, not `buildPlaybookSummaries`.
- Fix by either renaming the helper or changing the call.

Also review whether the global `TopBar` range control should remain visible on non-Analytics views. It currently uses `updateAnalyticsRange`, which clears custom dates. That may be acceptable, but it is worth checking behavior.

## What Is Left

- Fix the helper-name compile issue and run type/lint/test checks as appropriate.
- Add or update tests in `testcases/analytics.test.ts` for:
  - explicit `start`/`end` entry-time filtering;
  - shared filtering behavior used for playbook performance.
- Consider updating `AnalyticsReport` field names eventually, but keep scope small unless needed. Existing `closedTrades`/`openTrades` fields are still present even though UI should avoid open/live concepts.
- Update issue 017 acceptance checkboxes except the visual screenshot item, or mark the visual item as intentionally skipped per user instruction if that is the repo convention.
- Commit only relevant changes. Do not include unrelated `docs/handoffs/marketpilot-issue-014-handoff.md`.

## Verification Notes

- Do not do visual tests.
- No tests were run after the interrupted edits.
- Before committing, run at least non-visual checks such as `npm test` and/or `npm run lint` if they are available and pass locally.
