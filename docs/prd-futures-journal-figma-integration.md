# PRD: Futures Journal Figma Integration

## Problem Statement

MarketPilot currently has a stock-like trade journal implementation with open-position concepts, quantity-based calculations, and a large monolithic component. The user wants MarketPilot to become a futures-only, completed-trades-only journal that closely matches the provided Figma export's layout and interaction model.

The current app does not yet model required playbooks, confluences, trade ideas, risk-dollar and R-multiple outcome tracking, futures symbol autocomplete, or Figma-style Trade Log detail inspection. The existing dashboard also includes concepts that no longer fit the product direction, such as portfolio value, open positions, watchlists, and live position management.

## Solution

Rebuild MarketPilot around the futures journal domain captured in the glossary and ADRs. Users will log completed futures trades by entry time, futures symbol, direction, risk dollars, R multiple, confluences, trade idea, and required playbook assignment. The app will derive realized P&L and outcome status from risk dollars and R multiple.

The Figma export becomes the visual and interaction target. The implementation will split the current trade journal monolith into focused Next.js components for the Figma-style app shell, Trade Log, detail drawer, trade modal, Journal, Playbooks, Dashboard, Analytics, and Settings. Recharts will power dashboard and analytics visuals. Import and AI are deferred until the new manual logging workflow stabilizes.

## User Stories

1. As a futures trader, I want MarketPilot to focus only on completed trades, so that the journal stays centered on post-trade review.
2. As a futures trader, I want to log a completed trade without tracking contracts, so that I can journal based on risk dollars and R outcome.
3. As a futures trader, I want to enter the time I entered the market, so that my journal reflects when the trade was taken.
4. As a futures trader, I want to enter a futures symbol, so that each trade is tied to the instrument I traded.
5. As a futures trader, I want symbol autocomplete for common futures products, so that logging trades is fast and consistent.
6. As a futures trader, I want to save custom symbols outside the autocomplete catalog, so that broker-specific or newer symbols are not blocked.
7. As a futures trader, I want saved symbols normalized to uppercase, so that my Trade Log stays consistent.
8. As a futures trader, I want to mark each trade as long or short, so that filtering and review match my trade direction.
9. As a futures trader, I want to enter risk dollars, so that position sizing is recorded in the way I actually review trades.
10. As a futures trader, I want to enter a signed R multiple like `+2R` or `-1.5R`, so that the trade outcome is captured in risk units.
11. As a futures trader, I want MarketPilot to calculate realized P&L from risk dollars and R multiple, so that I do not have to manually duplicate the outcome.
12. As a futures trader, I want MarketPilot to derive win, loss, or breakeven status, so that status cannot drift from the outcome math.
13. As a futures trader, I want the dense Trade Log to show whole-dollar P&L, so that the table remains easy to scan.
14. As a futures trader, I want detail views to show cents where useful, so that I can inspect precise trade outcomes.
15. As a futures trader, I want every trade assigned to a playbook, so that I can evaluate strategies from real logged outcomes.
16. As a futures trader, I want to create a playbook with a name, description, color, and individual rules, so that each strategy has a clear definition.
17. As a futures trader, I want to create a playbook inline while logging a trade, so that required playbook assignment never blocks first-time use.
18. As a futures trader, I want playbook rules stored as individual criteria, so that they can be displayed and edited cleanly.
19. As a futures trader, I want the Playbooks tab to show win rate, average return, average R, total trades, best trade, and worst trade, so that I can compare strategies.
20. As a futures trader, I want playbook performance derived from assigned trades, so that stats update automatically when trade logs change.
21. As a futures trader, I want to write confluences as free text, so that I can capture confirming factors without rigid tagging too early.
22. As a futures trader, I want to write a trade idea, so that I can preserve why the completed trade was taken.
23. As a futures trader, I want trade idea and confluences displayed in the Trade Log detail drawer, so that I can inspect journal context from the table.
24. As a futures trader, I want trade idea and confluences stored once on the journal entry, so that the Trade Log and Journal views cannot drift.
25. As a futures trader, I want a dedicated Journal tab, so that I have a deeper review and editing surface beyond the Trade Log drawer.
26. As a futures trader, I want a Figma-style Trade Log table, so that the main journal surface feels polished and scan-friendly.
27. As a futures trader, I want to click a Trade Log row and see a right-side detail drawer, so that I can inspect a trade without leaving the table.
28. As a futures trader, I want the Trade Log to filter and sort completed trades, so that I can quickly find patterns.
29. As a futures trader, I want the Dashboard to show journal-supported outcome metrics, so that I can understand performance without live portfolio data.
30. As a futures trader, I want dashboard metrics like net P&L, win rate, total trades, average R, average win, average loss, and profit factor, so that I can review core performance.
31. As a futures trader, I want daily P&L and equity curve charts, so that I can see outcome trends over time.
32. As a futures trader, I want date-range filtering by entry time, so that I can review recent periods and year-to-date performance.
33. As a futures trader, I want Analytics to use completed trades only, so that active or hypothetical trades never pollute results.
34. As a futures trader, I want the app navigation to include Dashboard, Trade Log, Journal, Playbooks, Analytics, and Settings, so that the product matches the Figma layout and current scope.
35. As a futures trader, I want portfolio, watchlist, open monitor, and calendar views removed, so that the app does not imply live position tracking.
36. As a futures trader, I want a Settings tab matching the Figma visual direction, so that account and workspace information has a consistent home.
37. As an authenticated user, I want all trades, journal entries, and playbooks scoped to my account, so that my trading data stays private.
38. As an authenticated user, I want playbook and trade routes protected by ownership checks, so that another user cannot read or mutate my data.
39. As a product owner, I want the current Figma export to be the visual target, so that implementation decisions are aligned with the approved design direction.
40. As a developer, I want the existing monolithic journal component split into focused components, so that future changes are easier to reason about.
41. As a developer, I want selectively ported Figma primitives and theme tokens, so that the UI matches Figma without importing unused generated surface area.
42. As a developer, I want Recharts used for charting, so that the dashboard matches the export without maintaining custom SVG charts.
43. As a developer, I want CSV import deferred, so that import mapping can be designed after the manual workflow stabilizes.
44. As a developer, I want AI analysis deferred, so that AI can use the new playbook, confluence, trade idea, risk-dollar, and R-multiple model.
45. As a developer, I want validation tests for futures journal inputs, so that invalid risk, R, direction, symbol, playbook, and journal data are rejected.
46. As a developer, I want route tests around authenticated ownership, so that private data boundaries remain enforced.
47. As a developer, I want analytics tests around risk-dollar and R-multiple calculations, so that derived metrics remain correct.

## Implementation Decisions

- MarketPilot is futures-only and post-trade-only.
- Trades represent completed futures position records, not open positions, planned setups, or partial trades.
- Entry price, exit price, contracts, quantity, shares, lots, portfolio value, cash balance, unrealized gains, open positions, watchlist, and sector allocation are out of scope.
- A trade stores entry time, symbol, direction, risk dollars, R multiple, user ownership, and required playbook assignment.
- Direction is a strict long/short enum.
- Risk dollars are a positive decimal amount and may include cents.
- R multiple is a signed decimal outcome input displayed like `+2R` or `-2R`, valid from `-50R` to `+50R`.
- Realized P&L is derived as `riskDollars * rMultiple`.
- Outcome status is derived from realized P&L as win, loss, or breakeven.
- Trade idea and confluences are stored once on a one-to-one journal entry associated with the trade.
- Confluences are a single free-text field for the first implementation, not structured tags.
- Every completed trade must reference a playbook.
- Playbooks store definition fields: name, description, individual rules, and color.
- Playbook performance metrics are derived from assigned trades, not stored.
- The add-trade flow must support inline playbook creation and automatically assign the new trade to that playbook.
- Futures symbol autocomplete uses a curated catalog grouped by market category.
- Users may save symbols outside the curated catalog; validation checks format and length, not catalog membership.
- Symbols are normalized to uppercase on save.
- Analytics run over completed trades with date-range filtering by entry time.
- Dashboard and Analytics metrics include net P&L, win rate, total trades, average R, average win, average loss, profit factor, daily P&L, equity curve, and playbook performance.
- The Figma export's layout and interaction model are the target.
- The current large journal component should be split into focused local Next.js components.
- The app shell includes Dashboard, Trade Log, Journal, Playbooks, Analytics, and Settings.
- Portfolio, Watchlist, Open Monitor, and Calendar views are removed.
- The Trade Log includes a Figma-style table and clickable row detail drawer.
- The Trade Log detail drawer displays joined journal context, including trade idea and confluences.
- The Journal tab remains a deeper review/editing surface.
- Recharts is used for dashboard and analytics charts.
- Figma UI primitives and theme tokens are selectively ported instead of importing the full generated UI folder.
- Settings is included and should use real account/workspace data only until preference features are deliberately added.
- CSV import is deferred until manual logging stabilizes.
- AI analysis is deferred until the new journal/playbook model stabilizes.

## Testing Decisions

- Tests should assert external behavior and domain outcomes rather than component internals or Prisma implementation details.
- The primary testing seam should be the authenticated route/API behavior plus pure analytics calculation helpers. This covers the highest-value behavior with minimal coupling.
- Existing validation tests are prior art for checking accepted and rejected trade payloads.
- Existing analytics tests are prior art for checking calculation behavior and date filtering.
- Existing route-oriented test case inventories are prior art for auth-protected behavior and user ownership expectations.
- Trade validation tests should cover required playbook assignment, entry time, futures symbol normalization, long/short direction, positive risk dollars, R range from `-50` to `50`, trade idea, and confluences.
- Trade route tests should cover create, list, detail, update, delete, authenticated access, and ownership isolation.
- Playbook route tests should cover create, list, update, delete, inline creation support, rule validation, and ownership isolation.
- Analytics tests should cover realized P&L derivation, outcome status derivation, win rate, average R, average win, average loss, profit factor, daily P&L, equity curve, playbook performance, and date-range filtering by entry time.
- UI tests, if added, should focus on user-visible workflows: selecting/creating a playbook while logging a trade, symbol autocomplete behavior, row selection opening the detail drawer, and navigation between Figma tabs.
- Build and lint must pass after the integration.

## Out of Scope

- Planned, open, or partial trade workflows.
- Entry/exit price tracking.
- Contract, lot, share, quantity, or position-size tracking.
- Live portfolio management.
- Watchlists.
- Open position monitoring.
- Calendar view.
- Portfolio value, cash balance, sector allocation, open positions, and unrealized gains.
- CSV import.
- AI trade analysis.
- Strict database enum membership for futures symbols.
- Normalized confluence tags or confluence analytics.
- User preference systems beyond real Settings account/workspace display.

## Further Notes

This PRD is grounded in the domain glossary and ADRs created during the `/grill-with-docs` session. The most important implementation constraint is to preserve the Figma export's visual direction while adapting the model to the futures-only completed-trade journal domain.

The current implementation already has auth, basic trade routes, validation, analytics helpers, and a working app shell, but those pieces need to be reshaped around the new domain rather than extended with old stock/open-position assumptions.
