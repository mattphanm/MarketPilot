# Progress

## Trade journal core
- Built an authenticated trade journal on the home page.
- How: [app/page.tsx](/Users/matthewphan/Documents/Codex-Agentic/Projects/marketpilot/app/page.tsx:65) loads the signed-in user’s trades from Prisma, then passes them into the client journal component for rendering and CRUD actions.
- Why: this keeps private user data on the server until the page is authorized, while letting the client handle fast trade entry and edits.

## Trade CRUD
- Added create, edit, and delete flows for trades.
- How: [app/components/trade-journal.tsx](/Users/matthewphan/Documents/Codex-Agentic/Projects/marketpilot/app/components/trade-journal.tsx:377) submits JSON to `/api/trades` and `/api/trades/[id]`, then updates local state from API responses.
- Why: the journal needs a single place to manage trade lifecycle without a full-page refresh.

## Trade validation
- Added schema-backed validation for trade payloads and date input.
- How: [lib/validations/trade.ts](/Users/matthewphan/Documents/Codex-Agentic/Projects/marketpilot/lib/validations/trade.ts:1) and [lib/trades/date-input.ts](/Users/matthewphan/Documents/Codex-Agentic/Projects/marketpilot/lib/trades/date-input.ts:1) enforce required fields, date ordering, and 24-hour date parsing.
- Why: this prevents malformed trades from reaching the database and keeps the date entry format consistent.

## Analytics API
- Implemented `GET /api/analytics`.
- How: [app/api/analytics/route.ts](/Users/matthewphan/Documents/Codex-Agentic/Projects/marketpilot/app/api/analytics/route.ts:40) authenticates the request, scopes it to the current user, supports range filters, and returns a computed analytics report.
- Why: the dashboard can reuse the same report shape from either the client state or the API later without duplicating logic.

## Analytics reporting engine
- Added shared analytics calculations.
- How: [lib/analytics/report.ts](/Users/matthewphan/Documents/Codex-Agentic/Projects/marketpilot/lib/analytics/report.ts:1) computes net P&L, win rate, profit factor, expectancy, daily buckets, equity points, and calendar weeks from trade records.
- Why: centralizing the math keeps the UI thin and makes the reporting logic testable.

## Reports UI
- Reworked the top of the journal into a report-style dashboard.
- How: [app/components/trade-journal.tsx](/Users/matthewphan/Documents/Codex-Agentic/Projects/marketpilot/app/components/trade-journal.tsx:523) now shows range filters, metric cards, an equity curve, and a score summary above the journal table.
- Why: the page now answers the main performance questions first instead of only listing raw trades.

## Calendar view
- Added a monthly P&L calendar below the report summary.
- How: [app/components/trade-journal.tsx](/Users/matthewphan/Documents/Codex-Agentic/Projects/marketpilot/app/components/trade-journal.tsx:742) renders a six-week grid with per-day realized P&L, trade counts, and weekly totals.
- Why: this mirrors the kind of visual review traders use to spot streaks, concentration, and weak periods quickly.

## Test coverage
- Added tests for the new analytics behavior.
- How: [testcases/analytics.test.ts](/Users/matthewphan/Documents/Codex-Agentic/Projects/marketpilot/testcases/analytics.test.ts:123) now checks realized performance, date range filtering, and month calendar aggregation.
- Why: the new reporting logic is shared and math-heavy, so it needs direct coverage to avoid regressions.
