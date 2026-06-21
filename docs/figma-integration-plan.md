# Figma Integration Implementation Plan

This plan turns the Figma export at `/Users/matthewphan/Downloads/Investor Analytics Dashboard (2)` into the target MarketPilot application while preserving the decisions captured in `CONTEXT.md` and `docs/adr/`.

## Product Scope

MarketPilot is a futures-only post-trade journal. Users log completed trades, assign each trade to a playbook, capture confluences and trade idea, and review performance through dashboard, trade log, journal, playbook, analytics, and settings views.

Out of scope for the first integration:
- Open, planned, or partial trade workflows
- Entry/exit prices
- Contracts, shares, lots, quantity, portfolio value, open positions, watchlist, cash balance, unrealized gains, and sector allocation
- CSV import
- AI analysis

## Target Data Model

`Trade`
- `id`
- `userId`
- `playbookId`
- `symbol`
- `direction`: `LONG | SHORT`
- `entryTime`
- `riskDollars`
- `rMultiple`
- `createdAt`
- `updatedAt`

Derived from `Trade`
- `realizedPnl = riskDollars * rMultiple`
- `outcomeStatus = WIN | LOSS | BREAKEVEN`

`JournalEntry`
- `id`
- `tradeId`
- `tradeIdea`
- `confluences`
- `createdAt`
- `updatedAt`

`Playbook`
- `id`
- `userId`
- `name`
- `description`
- `rules: String[]`
- `color`
- `createdAt`
- `updatedAt`

Derived from assigned trades
- `winRate`
- `avgReturn`
- `avgRMultiple`
- `totalTrades`
- `bestTrade`
- `worstTrade`

## UI Target

Use the Figma export layout as the visual target, split into focused local Next.js components:
- `Sidebar`
- `TopBar`
- `DashboardView`
- `TradeLogView`
- `TradeDetailDrawer`
- `TradeFormModal`
- `JournalView`
- `PlaybooksView`
- `PlaybookFormModal`
- `AnalyticsView`
- `SettingsView`

Use Recharts for dashboard and analytics visuals. Selectively port Figma primitives and theme tokens instead of importing the entire generated `ui/` folder.

## Implementation Order

1. Update Prisma schema for futures journal domain.
2. Add validation schemas for trades, journal entries, playbooks, and futures symbol input.
3. Add futures symbol catalog for autocomplete.
4. Update API routes for playbooks and completed trade logs.
5. Update analytics calculations to use risk dollars and R multiple.
6. Split `trade-journal.tsx` into focused components.
7. Port the Figma app shell: sidebar, top bar, Trade Log, detail drawer, add-trade modal, Playbooks, Dashboard, Analytics, Journal, and Settings.
8. Update tests around validation, auth ownership, trade CRUD, playbook assignment, and analytics.
9. Run lint, tests, and build.

## Acceptance Criteria

- Users can create playbooks with name, description, color, and individual rules.
- Users can log a completed futures trade only after selecting or creating a playbook.
- Trade form captures entry time, symbol, direction, risk dollars, R multiple, confluences, and trade idea.
- Trade Log matches the Figma layout direction and shows derived P&L, R, outcome status, confluences, playbook, and trade idea in the row/detail drawer experience.
- Playbooks tab shows definition fields plus derived performance from assigned trades.
- Dashboard and Analytics use completed trades only and support date-range filtering by entry time.
- Settings tab exists and uses the Figma visual direction with real account/workspace data only.
- Import and AI remain deferred until the new manual workflow is stable.
