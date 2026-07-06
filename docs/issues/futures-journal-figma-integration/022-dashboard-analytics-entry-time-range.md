## Parent

#1

## What to build

Make Dashboard and Analytics consistently use the shared Entry-Time Range contract for performance calculations. Selecting ALL, 30D, 90D, or YTD should filter completed Trades by Entry Time for Dashboard KPI cards, Dashboard charts, and Analytics metrics, while reusing the existing completed-trade analytics/report behavior rather than introducing another range model.

## Acceptance criteria

- [ ] Dashboard KPI cards respond to Entry-Time Range for completed-trade metrics such as net P&L, win rate, total trades, average R, and related values.
- [ ] Dashboard charts respond to Entry-Time Range for daily P&L and equity curve data.
- [ ] Analytics metrics respond to Entry-Time Range using the same supported values: all, 30d, 90d, and ytd.
- [ ] ALL includes every completed Trade; 30D, 90D, and YTD filter by Entry Time against the appropriate trailing/year-to-date windows.
- [ ] Empty selected windows show valid zeroed or empty analytics states rather than errors or hidden surfaces.
- [ ] Tests cover the shared analytics/report seam for Entry-Time Range behavior and empty-range behavior.

## Blocked by

None - can start immediately
