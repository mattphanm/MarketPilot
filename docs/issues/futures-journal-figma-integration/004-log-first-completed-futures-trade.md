## Parent

#1

## What to build

Let a user log a completed futures Trade assigned to a Playbook. The trade form captures entry time, futures symbol, direction, risk dollars, R multiple, selected Playbook, confluences, and trade idea. Trade idea and confluences are stored once on the Journal Entry associated with the Trade.

## Acceptance criteria

- [ ] Users can create a completed futures Trade assigned to an existing Playbook.
- [ ] Users can enter entry time, symbol, direction, risk dollars, R multiple, confluences, and trade idea.
- [ ] Direction is limited to long or short.
- [ ] Risk dollars are positive decimals.
- [ ] R multiple accepts signed values from `-50R` to `+50R`.
- [ ] Trade and Journal Entry data are owned by the authenticated user.
- [ ] Visual test: capture a screenshot of the add-trade modal and the resulting Trade Log row after save.

## Blocked by

- #3
