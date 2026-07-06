## Problem Statement

MarketPilot's top bar currently presents controls that look actionable but do not match the product's post-trade futures journal workflow. A trader can see a separate "Current range" control, a global Search placeholder, a Sync button, and a notification affordance, even though the settled product scope only has real search inside the Trade Log and has deferred import/sync work until manual logging stabilizes.

The Entry-Time Range also needs a clear behavioral boundary. Traders should be able to change the performance window for analytics surfaces, but that same range should not hide completed trades from the Trade Log or Journal lists. Without this distinction, range changes can feel like missing data rather than intentional analytics scoping.

## Solution

Simplify the top bar so it contains the page title/subtitle and the shared Entry-Time Range presets: ALL, 30D, 90D, and YTD. Remove the placeholder Current range, global Search, Sync, and notification controls.

The Entry-Time Range filters completed trades by Entry Time only for analytics/performance surfaces: Dashboard, Playbooks, and Analytics. Trade Log and Journal lists continue to show completed trades independently of the Entry-Time Range, with Trade Log retaining its own real search, result filter, direction filter, and sort behavior.

If Sync returns later, it should be specified as a real import, broker, or export workflow instead of reintroducing a placeholder top-bar button.

## User Stories

1. As a futures trader, I want the top bar to show only real controls, so that I do not waste attention on placeholder actions.
2. As a futures trader, I want the Current range dropdown removed, so that the Entry-Time Range presets are the only top-bar range control.
3. As a futures trader, I want the global Search placeholder removed, so that search does not imply a global command palette that does not exist.
4. As a futures trader, I want the Sync placeholder removed, so that I am not led to expect broker import or export behavior that has not been defined.
5. As a futures trader, I want the notification button removed, so that the journal does not imply alerts or inbox workflows outside the current product scope.
6. As a futures trader, I want the top bar to keep ALL, 30D, 90D, and YTD presets, so that I can quickly change the performance window.
7. As a futures trader, I want the selected Entry-Time Range to be visually clear, so that I know which performance window I am reviewing.
8. As a futures trader, I want Entry-Time Range presets to filter by Entry Time, so that analytics match the trade date used across MarketPilot.
9. As a futures trader, I want ALL to include every completed trade in analytics/performance surfaces, so that I can review lifetime journal performance.
10. As a futures trader, I want 30D to include completed trades entered during the trailing 30-day window, so that I can review recent performance.
11. As a futures trader, I want 90D to include completed trades entered during the trailing 90-day window, so that I can review medium-term performance.
12. As a futures trader, I want YTD to include completed trades entered since the start of the current year, so that I can review annual performance.
13. As a futures trader, I want Dashboard KPI cards to respond to Entry-Time Range, so that net P&L, win rate, total trades, average R, and related metrics match the selected window.
14. As a futures trader, I want Dashboard charts to respond to Entry-Time Range, so that daily P&L and equity curve views reflect the selected performance window.
15. As a futures trader, I want Dashboard Playbook Performance to respond to Entry-Time Range, so that setup comparisons match the same window as the Dashboard metrics.
16. As a futures trader, I want the Playbooks tab performance metrics to respond to Entry-Time Range, so that each Playbook's win rate, average P&L, average R, best trade, worst trade, and trade count reflect the selected window.
17. As a futures trader, I want Playbook definitions to remain visible even when the selected Entry-Time Range has no assigned trades, so that filtering performance does not hide the Playbook itself.
18. As a futures trader, I want Analytics metrics to respond to Entry-Time Range, so that behavior, consistency, and performance analysis use the selected window.
19. As a futures trader, I want Analytics playbook summaries to respond to Entry-Time Range, so that the Analytics view and Playbooks view do not disagree about filtered Playbook performance.
20. As a futures trader, I want Trade Log rows to ignore Entry-Time Range, so that changing analytics scope does not hide completed trades from my completed trade history.
21. As a futures trader, I want Trade Log search to remain available only inside the Trade Log, so that I can search symbols, Trade Ideas, and Confluences where that behavior is real.
22. As a futures trader, I want Trade Log result and direction filters to keep working independently of Entry-Time Range, so that local list filtering remains predictable.
23. As a futures trader, I want Trade Log sorting to keep using the full visible Trade Log result set, so that range changes do not reorder or remove rows unexpectedly.
24. As a futures trader, I want Journal review lists to ignore Entry-Time Range, so that all completed trades remain available for post-trade reflection.
25. As a futures trader, I want editing a Journal Entry to remain possible regardless of the selected Entry-Time Range, so that performance filtering never blocks reflection work.
26. As a futures trader, I want adding or editing a completed Trade to remain independent of Entry-Time Range, so that logging workflows are not constrained by analytics controls.
27. As a futures trader, I want the top-bar presets to work from Dashboard, Playbooks, and Analytics, so that I can change performance scope without switching views.
28. As a futures trader, I want switching to Trade Log after choosing a range to still show all completed trades, so that I understand the range is analytical rather than archival.
29. As a futures trader, I want switching to Journal after choosing a range to still show all Journal Entries, so that review work remains complete.
30. As a futures trader, I want empty analytics/performance states for a selected range to show zeroed or empty metrics without hiding definitions, so that no-trade windows are understandable.
31. As a futures trader on a narrow screen, I want the Entry-Time Range presets to remain usable without layout overlap, so that the top bar stays functional on mobile.
32. As a keyboard or assistive-technology user, I want range preset buttons to expose selected state, so that the current Entry-Time Range is accessible.
33. As a product maintainer, I want the top bar to avoid placeholder controls, so that future UI additions require real product contracts.
34. As a product maintainer, I want Sync to remain out of scope until import, broker, or export behavior is specified, so that data workflows are not implied before they are designed.
35. As an implementation agent, I want one shared Entry-Time Range filtering path for analytics/performance surfaces, so that Dashboard, Playbooks, and Analytics do not drift.
36. As an implementation agent, I want Trade Log and Journal list paths to remain separate from analytics filtering, so that range logic cannot accidentally remove completed trades from review surfaces.

## Implementation Decisions

- Use the existing domain term Entry-Time Range. Do not rename it to Current range, created-date range, or live-position range.
- The top-bar Entry-Time Range presets are ALL, 30D, 90D, and YTD.
- Entry-Time Range filters completed trades by Entry Time.
- Entry-Time Range applies to Dashboard, Playbooks, and Analytics because those are analytics/performance surfaces.
- Entry-Time Range does not apply to Trade Log or Journal lists.
- Keep real search scoped to Trade Log. Trade Log search covers Futures Symbol, Trade Idea, and Confluences.
- Remove placeholder top-bar controls for Current range, global Search, Sync, and notifications.
- Reuse the existing analytics range keys and completed-trade analytics logic rather than creating a second range model.
- Feed range-filtered completed trades into Playbook performance derivation wherever the surface is displaying performance for the selected Entry-Time Range.
- Preserve Playbook definitions independently of filtered performance. A Playbook with no trades in the selected Entry-Time Range should still be visible with empty or zeroed performance values.
- Keep Trade Log query behavior independent from Entry-Time Range. Trade Log search, result filters, direction filters, and sorting should operate on the Trade Log's completed-trade list.
- Keep Journal review and edit behavior independent from Entry-Time Range.
- Do not add schema changes.
- Do not add new API contracts unless the existing UI data flow cannot support the feature. If an API contract is touched, it should continue to use the same supported range values: all, 30d, 90d, and ytd.
- Do not introduce import, broker sync, export, notification, or global command-palette workflows in this PRD.
- If Sync returns later, define it as a real import, broker, or export workflow with its own product contract and tests.
- Keep the primary navigation as Dashboard, Trade Log, Journal, Playbooks, Analytics, and Settings.
- Maintain responsive behavior for the top-bar range controls, including narrow widths where presets may need horizontal overflow.
- Maintain accessible selected state on preset controls.

## Testing Decisions

- Good tests should verify user-visible behavior and domain behavior, not implementation details such as component-local state names.
- The highest-value seam is the existing completed-trade analytics/report behavior: it already owns supported range keys, Entry Time bounds, and analytics aggregation.
- The second seam is Playbook performance derivation using an already range-filtered completed-trade set. This verifies that Playbook performance changes with Entry-Time Range without duplicating date math in Playbooks.
- The guardrail seam is the Trade Log query behavior. Tests should demonstrate that Trade Log search/filter/sort remains independent of Entry-Time Range rather than coupling list visibility to analytics scope.
- Extend existing analytics report tests that already cover supported relative date ranges and explicit Entry Time bounds.
- Extend existing Playbook performance tests or analytics tests to cover range-filtered Playbook performance inputs, including the case where a Playbook remains visible with zero filtered trades.
- Extend existing Trade Log query helper tests, or add an equivalent high-level test if a shared view-model seam is introduced, to prove range selection does not remove Trade Log rows.
- If UI tests are added, they should assert that the top bar no longer exposes Current range, global Search, Sync, or notification controls, and still exposes the ALL, 30D, 90D, and YTD presets.
- If no component/UI test harness exists, use logic tests for the range and list behavior plus manual browser verification for the top-bar cleanup and responsive layout.
- Prior art in the codebase includes analytics report calculation tests, Playbook performance derivation tests, and Trade Log query helper tests.

## Out of Scope

- Building import, broker sync, CSV import, export, or reconciliation workflows.
- Adding notifications, alerts, inboxes, or unread states.
- Adding global search, command palette, or keyboard launcher behavior.
- Changing the Trade Log's local search semantics beyond preserving it as the only real search surface.
- Filtering Trade Log or Journal lists by Entry-Time Range.
- Changing the domain model for completed Trade, Journal Entry, Playbook, Entry Time, R Multiple, Risk Dollars, or Realized P&L.
- Adding open-position, portfolio, watchlist, calendar, sector allocation, cash balance, or unrealized P&L surfaces.
- Redesigning custom date-range controls beyond keeping the settled top-bar presets coherent with existing analytics behavior.
- Changing authentication, persistence, or database schema.

## Further Notes

- `CONTEXT.md` already defines Entry-Time Range; this PRD uses that term and does not introduce new domain language.
- The settled decisions align with the ADRs for post-trade-only workflow, Entry Time as trade date, analytics over completed trades, dashboard metrics scope, derived Playbook performance, deferred import, Trade Log journal context, and futures journal navigation.
- Coordinate implementation with existing Dashboard, Playbooks, and Analytics work so range filtering is shared rather than reimplemented separately by each surface.
