# MarketPilot Issue 004 Handoff

Next session focus: implement Issue 004 only. User says Issue 003 is complete; do not re-verify it until the end.

## Suggested Skills

- `mattpocock-skills:implement`
- `mattpocock-skills:tdd` for validation/analytics seams if helpful

## Source Of Truth

- Issue: `docs/issues/futures-journal-figma-integration/004-log-first-completed-futures-trade.md`
- Key ADRs: `docs/adr/0003-separate-journal-entry-from-trade.md`, `docs/adr/0004-derive-outcome-metrics.md`, `docs/adr/0005-require-playbook-for-every-trade.md`, `docs/adr/0007-store-confluences-as-free-text.md`, `docs/adr/0011-omit-entry-exit-prices.md`

## What To Implement

- Completed futures trade create flow assigned to an existing Playbook.
- Fields: entry time, symbol, direction long/short, risk dollars, signed R multiple, playbook, confluences, trade idea.
- Persist execution facts on `Trade`; persist `tradeIdea` and `confluences` once on one-to-one `JournalEntry`.
- Require authenticated ownership for both Trade and JournalEntry; validate selected Playbook belongs to the user.
- Derive P&L as `riskDollars * rMultiple`; do not use entry/exit prices for this issue.

## Current Code Seams

- Data model: `prisma/schema.prisma`
- Trade DTO/payload: `lib/trades/types.ts`
- Validation: `lib/validations/trade.ts`
- Analytics P&L: `lib/analytics/report.ts`
- APIs: `app/api/trades/route.ts`, `app/api/trades/[id]/route.ts`, `app/api/analytics/route.ts`
- Server serialization: `app/page.tsx`
- UI form/log: `app/components/trade-journal.tsx`
- Tests: `testcases/trades.test.ts`, `testcases/analytics.test.ts`

## Notes From Context Gathering

- Current trade flow is still old equity/open-trade shape: `entry`, `exit`, `quantity`, optional `playbookId`, optional `notes`.
- Issue 004 should move the create flow to futures completed trades: required `playbookId`, `riskDollars > 0`, `rMultiple` between `-50` and `50`.
- Next.js 16 route handlers use async params in `[id]` route; preserve existing convention.
- Read relevant bundled Next docs before coding per `AGENTS.md`; route handler docs already checked: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.

## Start Here

1. Add/adjust tests for trade validation and analytics P&L.
2. Update Prisma schema and migration.
3. Update API validation/persistence, including JournalEntry create/update.
4. Update UI form and trade log display.
5. Run focused tests, typecheck, then full suite/review/commit.
