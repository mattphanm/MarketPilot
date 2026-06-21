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
- [ ] Replace stock-like trade fields with futures journal fields
- [ ] Add `Playbook` model with name, description, rules, and color
- [ ] Add required trade-to-playbook relationship
- [ ] Add `JournalEntry` model for trade idea and confluences
- [ ] Add strict direction enum for `LONG` and `SHORT`
- [ ] Remove open, planned, partial, quantity, entry price, and exit price workflow assumptions
- [ ] Run migrations for schema updates

## 3. Trades
- [ ] Update `POST /api/trades` for completed futures trades
- [ ] Update `GET /api/trades` for joined trade, journal, and playbook data
- [ ] Update `GET /api/trades/[id]`
- [ ] Update `PATCH /api/trades/[id]`
- [ ] Update `DELETE /api/trades/[id]`
- [ ] Validate entry time, futures symbol, direction, risk dollars, R multiple, playbook, trade idea, and confluences
- [ ] Derive realized P&L and outcome status from risk dollars and R multiple
- [ ] Add list filtering, sorting, and pagination

## 4. Playbooks
- [ ] Implement `POST /api/playbooks`
- [ ] Implement `GET /api/playbooks`
- [ ] Implement `PATCH /api/playbooks/[id]`
- [ ] Implement `DELETE /api/playbooks/[id]`
- [ ] Enforce ownership checks on playbook routes
- [ ] Derive playbook win rate, average return, average R, total trades, best trade, and worst trade from assigned trades
- [ ] Support inline playbook creation from the add-trade flow

## 5. Futures Symbols
- [ ] Add curated futures symbol catalog
- [ ] Add symbol autocomplete in trade form
- [ ] Allow custom symbols outside the catalog
- [ ] Normalize saved symbols to uppercase

## 6. Figma UI Integration
- [ ] Split `app/components/trade-journal.tsx` into focused local components
- [ ] Port Figma theme tokens and layout direction
- [ ] Add Recharts for dashboard and analytics charts
- [ ] Build Figma-style sidebar and top bar
- [ ] Build Figma-style Trade Log table
- [ ] Build Trade Log detail drawer with joined journal context
- [ ] Build completed-trade add/edit modal
- [ ] Build Journal tab as deeper review/editing surface
- [ ] Build Playbooks tab from real playbook data
- [ ] Build Dashboard with journal-supported metrics
- [ ] Build Analytics with completed-trade metrics
- [ ] Include Settings tab using real account/workspace data
- [ ] Remove portfolio, watchlist, open monitor, and calendar views

## 7. Analytics
- [ ] Decide and implement first analytics metrics: net P&L, win rate, total trades, average R, average win, average loss, profit factor, daily P&L, equity curve, and playbook performance
- [ ] Add date-range filtering by entry time
- [ ] Add summary cards and Recharts charts
- [ ] Add cached or computed-on-demand strategy if needed

## 8. Deferred Scope
- [ ] Revisit CSV import after manual logging stabilizes
- [ ] Revisit AI analysis after the journal/playbook model stabilizes

## 9. Quality
- [ ] Add tests for auth-protected routes
- [ ] Add tests for trade CRUD
- [ ] Add tests for playbook CRUD and assignment
- [ ] Add tests for futures trade validation
- [ ] Add tests for analytics calculations
- [ ] Run lint and build cleanly
- [ ] Fix TypeScript and route handler issues

## Notes
- Keep this file updated as scope changes.
- Check items off as each feature is fully working end-to-end.
