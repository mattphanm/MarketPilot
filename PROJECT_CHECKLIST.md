# MarketPilot Checklist

Use this file to track the Figma dashboard integration and futures journal rebuild.

## 1. Foundation
- [x] Auth is wired up with Google + Prisma
- [x] Confirm environment variables for auth and database
- [x] Harden `requireUser()` and shared session handling
- [x] Replace the default starter homepage
- [x] Set real app metadata and branding
- [x] Decide futures-only, completed-trades-only product scope
- [x] Capture domain glossary and ADRs for the Figma integration

## 2. Data Model
- [x] Replace stock-like trade fields with futures journal fields
- [x] Add `Playbook` model with name, description, rules, and color
- [x] Add required trade-to-playbook relationship
- [x] Add `JournalEntry` model for trade idea and confluences
- [x] Add strict direction enum for `LONG` and `SHORT`
- [x] Remove open, planned, partial, quantity, entry price, and exit price workflow assumptions
- [x] Run migrations for schema updates

## 3. Trades
- [x] Update `POST /api/trades` for completed futures trades
- [x] Update `GET /api/trades` for joined trade, journal, and playbook data
- [x] Update `GET /api/trades/[id]`
- [x] Update `PATCH /api/trades/[id]`
- [x] Update `DELETE /api/trades/[id]`
- [x] Validate entry time, futures symbol, direction, risk dollars, R multiple, playbook, trade idea, and confluences
- [x] Derive realized P&L and outcome status from risk dollars and R multiple
- [x] Add list filtering, sorting, and pagination

## 4. Playbooks
- [x] Implement `POST /api/playbooks`
- [x] Implement `GET /api/playbooks`
- [x] Implement `PATCH /api/playbooks/[id]`
- [x] Implement `DELETE /api/playbooks/[id]`
- [x] Enforce ownership checks on playbook routes
- [x] Derive playbook win rate, average return, average R, total trades, best trade, and worst trade from assigned trades
- [x] Support inline playbook creation from the add-trade flow

## 5. Futures Symbols
- [x] Add curated futures symbol catalog
- [x] Add symbol autocomplete in trade form
- [x] Allow custom symbols outside the catalog
- [x] Normalize saved symbols to uppercase

## 6. Figma UI Integration
- [x] Split `app/components/trade-journal.tsx` into focused local components
- [x] Port Figma theme tokens and layout direction
- [x] Add Recharts for dashboard and analytics charts
- [x] Build Figma-style sidebar and top bar
- [x] Build Figma-style Trade Log table
- [x] Build Trade Log detail drawer with joined journal context
- [x] Build completed-trade add/edit modal
- [x] Build Journal tab as deeper review/editing surface
- [x] Build Playbooks tab from real playbook data
- [x] Build Dashboard with journal-supported metrics
- [x] Build Analytics with completed-trade metrics
- [x] Include Settings tab using real account/workspace data
- [x] Remove portfolio, watchlist, open monitor, and calendar views

## 7. Analytics
- [x] Decide and implement first analytics metrics: net P&L, win rate, total trades, average R, average win, average loss, profit factor, daily P&L, equity curve, and playbook performance
- [x] Add date-range filtering by entry time
- [x] Add summary cards and Recharts charts
- [x] Add cached or computed-on-demand strategy if needed

## 8. Deferred Scope (intentionally not built)
- CSV import: deferred until manual logging stabilizes. `POST /api/upload` returns 501. No UI entry point.
- AI analysis: deferred until the journal/playbook model stabilizes. `POST /api/ai/analyze-trades` returns 501. No UI entry point.

## 9. Quality
- [x] Add tests for auth-protected routes
- [x] Add tests for trade CRUD
- [x] Add tests for playbook CRUD and assignment
- [x] Add tests for futures trade validation
- [x] Add tests for analytics calculations
- [x] Run lint and build cleanly
- [x] Fix TypeScript and route handler issues

## Notes
- Keep this file updated as scope changes.
- Check items off as each feature is fully working end-to-end.
