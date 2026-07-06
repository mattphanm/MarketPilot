## Parent

#1

## What to build

Keep Trade Log and Journal review workflows independent from Entry-Time Range. A trader can change the performance window from analytics surfaces, then switch to Trade Log or Journal and still see the complete completed-Trade history and available Journal Entries. Trade Log-local search, result filters, direction filters, and sorting should continue to operate on the Trade Log's own completed-Trade list, not the analytics range.

## Acceptance criteria

- [x] Changing Entry-Time Range does not remove rows from Trade Log.
- [x] Trade Log search remains scoped to Trade Log and searches Futures Symbol, Trade Idea, and Confluences.
- [x] Trade Log result filters, direction filters, and sorting continue to operate independently of Entry-Time Range.
- [x] Journal review lists ignore Entry-Time Range and continue to show all relevant Journal Entries.
- [x] Editing a Journal Entry and adding or editing a completed Trade remain possible regardless of selected Entry-Time Range.
- [x] Tests cover the Trade Log query guardrail so Entry-Time Range cannot accidentally filter Trade Log rows.

## Blocked by

None - can start immediately
