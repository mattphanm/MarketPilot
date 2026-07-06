## Parent

#1

## What to build

Make Playbook performance respond to the selected Entry-Time Range anywhere Playbook performance is shown. The selected range should filter completed Trades by Entry Time before deriving Playbook metrics, but Playbook definitions themselves must remain visible even when a selected range has no matching assigned Trades.

## Acceptance criteria

- [x] The Playbooks tab derives win rate, average P&L, average R, best trade, worst trade, and trade count from completed Trades inside the selected Entry-Time Range.
- [x] Dashboard and Analytics Playbook performance summaries use the same range-filtered completed Trade set as the rest of their performance metrics.
- [x] A Playbook with no Trades in the selected Entry-Time Range remains visible with empty or zeroed performance values.
- [x] Playbook definition data is not filtered out by Entry-Time Range.
- [x] Tests cover range-filtered Playbook performance inputs, including the no-matching-trades case.

## Blocked by

- #22
