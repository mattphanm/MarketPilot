# MarketPilot Navbar + Range Handoff

## Focus

Next session should implement the UI decisions from the grill around the top bar/navbar and date range behavior.

## Settled decisions

- Remove the top-bar `Current range` control.
- Remove the top-bar Search placeholder.
- Keep real search scoped to Trade Log only.
- Remove the top-bar `Sync` button for now.
- Remove the notification button.
- Keep `ALL / 30D / 90D / YTD` as the top-bar Entry-Time Range controls.
- Entry-Time Range filters completed trades by Entry Time.
- Entry-Time Range should affect analytics/performance surfaces only: Dashboard, Playbooks, Analytics.
- Entry-Time Range should not affect Trade Log or Journal lists.
- If sync returns later, it should be defined as a real import/broker/export workflow, not a placeholder button.

## Existing artifact

- `CONTEXT.md` was updated with the glossary term **Entry-Time Range**. Do not duplicate that definition unless it changes.

## Suggested skills

- `mattpocock-skills:implement` for the actual code changes.
- `mattpocock-skills:tdd` if tests are added or adjusted around range behavior.
- `mattpocock-skills:domain-modeling` only if new domain language appears.
