# MarketPilot Issue 004 Continuation Handoff

## Focus

Continue interrupted implementation of `docs/issues/futures-journal-figma-integration/004-log-first-completed-futures-trade.md` using `docs/handoffs/marketpilot-issue-004-implementation-handoff.md` as the source context. Do not look in GitHub.

## Suggested Skills

- `mattpocock-skills:implement`
- `mattpocock-skills:tdd` if adding focused validation/analytics tests
- `browser:control-in-app-browser` only for the required visual screenshot check after the app compiles

## Current State

Partial, uncommitted Issue 004 work exists in the workspace. No tests/typecheck were run after these edits.

Files already edited:

- `prisma/schema.prisma`
- `prisma/migrations/20260622120000_add_futures_journal_entries/migration.sql`
- `lib/trades/types.ts`
- `lib/validations/trade.ts`
- `lib/analytics/report.ts`
- `app/api/trades/route.ts`
- `app/api/trades/[id]/route.ts`
- `app/api/analytics/route.ts`
- `app/page.tsx`
- `app/components/trade-journal.tsx`

Existing unrelated untracked handoff docs were present before this session:

- `docs/handoffs/marketpilot-issue-003-continuation-handoff.md`
- `docs/handoffs/marketpilot-issue-004-implementation-handoff.md`
- `docs/handoffs/marketpilot-session-4-handoff.md`

## What Was Implemented So Far

- Added `Trade.riskDollars`, `Trade.rMultiple`, and one-to-one `JournalEntry` model with `tradeIdea` and `confluences`.
- Added a migration for the new fields/table.
- Changed trade DTO/payload and validation from old stock/open-position fields to futures fields:
  - `playbookId`
  - `symbol`
  - `side: long | short`
  - `riskDollars`
  - `rMultiple`
  - `openedAt`
  - `tradeIdea`
  - `confluences`
- Updated analytics P&L derivation to `riskDollars * rMultiple`.
- Updated trade create/update routes to include journal context and validate selected playbook ownership.
- Updated `app/page.tsx` serialization/selects for joined `journalEntry`.
- Started updating `app/components/trade-journal.tsx`, but this file is incomplete and likely does not compile yet.

## Known Incomplete Work

- Finish `app/components/trade-journal.tsx` conversion. It still contains old references to `entry`, `exit`, `quantity`, `notes`, `closedAt`, `buy`, and `sell` in multiple sections.
- Pass `playbooks` into the trade form so users can choose an existing Playbook; require a selected Playbook before submit.
- Replace note UI with `tradeIdea` and `confluences`.
- Replace open/closed filters and open-trade dashboard language with completed-trade concepts.
- Update tests in `testcases/trades.test.ts` and `testcases/analytics.test.ts` for futures payloads and risk/R P&L.
- Run Prisma generation/migration workflow as appropriate, then `npm test`, `npm run lint`, and type/build checks.
- Required visual test: screenshot add-trade modal/form and resulting Trade Log row after save.
- Review work, then commit current branch when complete.

## Caution

The client file was interrupted mid-refactor. Start by running `rg "entry|exit|quantity|notes|closedAt|buy|sell" app/components/trade-journal.tsx` and replacing the remaining old domain assumptions deliberately.
