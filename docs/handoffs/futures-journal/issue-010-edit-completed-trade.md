# MarketPilot Issue 010 Handoff

Issue reference: `docs/issues/futures-journal-figma-integration/010-edit-completed-trade.md`

## Implemented So Far

- Added an edit action to the selected trade detail drawer in `app/components/trade-journal.tsx`.
- `TradeDetailDrawer` now accepts `onEdit: (trade: TradeDto) => void`.
- The drawer header now shows an icon-only edit button using the existing `Edit3` icon.
- `TradeLogView` passes its existing `onEdit` handler into `TradeDetailDrawer`.
- This reuses the existing `startEdit` flow, which populates the journal form via `tradeToForm`, switches to the Journal view, and saves through the existing `PATCH /api/trades/[id]` path.

## Verified

- Ran focused tests:
  - `npm test -- testcases/trades.test.ts testcases/trade-log-view.test.ts`
  - Result: 2 files passed, 10 tests passed.
- Ran lint:
  - `npm run lint`
  - Result: passed.

## Left To Do

- Run a full validation pass if desired:
  - `npm test`
  - `npm run build` or project typecheck equivalent if available.
- Complete the required visual acceptance check:
  - Launch the app.
  - Select a trade from Trade Log.
  - Click the drawer edit button.
  - Capture a screenshot of the edit state.
- The attempted `npm run dev` in this session failed in the sandbox with `listen EPERM` on `0.0.0.0:3000`, so no screenshot was captured.
- Review whether the row-level text `Edit` action is sufficient or should also be converted to an icon button for visual consistency. This was not changed.
- Commit was not created.

## Suggested Skills

- `mattpocock-skills:implement` to continue the issue implementation and finish verification.
- `browser:control-in-app-browser` for the visual screenshot once the dev server can run.
