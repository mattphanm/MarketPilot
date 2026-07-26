# MarketPilot handoffs

Handoffs preserve temporary continuation context between agent sessions. Durable product language belongs in `CONTEXT.md`; durable architectural decisions belong in `docs/adr/`; implementation requirements belong in issues or PRDs.

## Start here

| Workstream | Continuation point | Supporting context |
| --- | --- | --- |
| AI playbook analysis | [`ai/playbook-analysis-2026-07-10.md`](./ai/playbook-analysis-2026-07-10.md) | Continue the design grill from its unresolved question. |
| Settings and profile | [`settings-profile/grill-continuation-2026-07-06.md`](./settings-profile/grill-continuation-2026-07-06.md) | [`settings-profile/grill-2026-07-06.md`](./settings-profile/grill-2026-07-06.md) contains the earlier decisions. |
| Scroll-contained shell | [`shell-navigation/scroll-contained-shell-2026-07-05.md`](./shell-navigation/scroll-contained-shell-2026-07-05.md) | Use the Issue 031 regression checklist for verification. |

## Folder structure

### `ai/`

- [`playbook-analysis-2026-07-10.md`](./ai/playbook-analysis-2026-07-10.md) — AI-assisted post-trade analysis, Playbook Alignment, deviations, and drift.

### `settings-profile/`

- [`grill-continuation-2026-07-06.md`](./settings-profile/grill-continuation-2026-07-06.md) — latest continuation point.
- [`grill-2026-07-06.md`](./settings-profile/grill-2026-07-06.md) — original design-grill decisions.

### `shell-navigation/`

- [`scroll-contained-shell-2026-07-05.md`](./shell-navigation/scroll-contained-shell-2026-07-05.md) — shell behavior and implementation direction.
- [`issue-031-scroll-contained-shell-regression-checklist.md`](./shell-navigation/issue-031-scroll-contained-shell-regression-checklist.md) — automated and manual regression checks.
- [`navbar-range-decisions.md`](./shell-navigation/navbar-range-decisions.md) — top-bar and Entry-Time Range decisions.

### `futures-journal/`

These are historical, issue-scoped implementation handoffs. Prefer the corresponding file under `docs/issues/futures-journal-figma-integration/` as the durable requirement.

- Issue 003: [`playbook edit/delete`](./futures-journal/issue-003-playbook-edit-delete-2026-06-22.md), then [`continuation`](./futures-journal/issue-003-continuation.md)
- Issue 004: [`implementation`](./futures-journal/issue-004-implementation.md), then [`continuation`](./futures-journal/issue-004-continuation.md)
- Issue 010: [`edit completed trade`](./futures-journal/issue-010-edit-completed-trade.md)
- Issue 011: [`delete completed trade`](./futures-journal/issue-011-delete-completed-trade.md)
- Issue 014: [`Playbook performance`](./futures-journal/issue-014-playbook-performance.md)
- Issue 017: [`completed-trade analytics`](./futures-journal/issue-017-analytics.md)
- Issue 019: [`responsive visual pass`](./futures-journal/issue-019-responsive-visual-pass-2026-06-23.md)
- [`Session 4 checkpoint`](./futures-journal/session-4.md)

## Naming convention

- Use `issue-NNN-short-topic.md` for issue implementation handoffs.
- Use `topic-YYYY-MM-DD.md` for design or exploratory handoffs.
- Use `topic-continuation-YYYY-MM-DD.md` only when an earlier handoff remains useful.
- Add new handoffs to this index and link the newest continuation point under **Start here**.

