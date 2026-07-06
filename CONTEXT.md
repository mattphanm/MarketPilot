# MarketPilot

MarketPilot is a private futures trading journal for tracking completed trades, strategy playbooks, and post-trade learning.

## Language

**Trade**:
A completed futures position record, including entry time, symbol, direction, risk dollars, realized P&L, playbook assignment, confluences, and trade idea.
_Avoid_: Transaction, order, open position, planned setup, stock trade

**Trade Journal**:
The reflective record attached to completed trades, shown as a log of date, symbol, direction, realized P&L, risk, R multiple, outcome status, confluences, selected playbook, and trade idea.
_Avoid_: Notes, comments

**Trade Log**:
The tabular view of completed trades. It can display execution facts and joined journal context, including confluences and trade idea, in a row or detail drawer.
_Avoid_: Open positions, live portfolio

**Journal Entry**:
The structured reflection for exactly one completed trade, centered on the original trade idea.
_Avoid_: Note, comment, memo

**Trade Idea**:
The user's written rationale or notes for why the completed trade was taken.
_Avoid_: Thesis, memo, comment

**Confluences**:
The user's free-text summary of the confirming factors present in a completed trade.
_Avoid_: Tags, labels

**Playbook**:
A reusable trading model or setup definition that every completed trade must reference.
It stores definition fields such as name, description, individual rules, and presentation color; its performance is derived from completed trades assigned to it.
_Avoid_: Strategy tag, category, playbook tag

**Playbook Rule**:
One individual criterion or condition that defines a playbook.
_Avoid_: Bullet, checklist item

**Playbook Assignment**:
The required selection of one existing playbook when a user logs a completed trade.
_Avoid_: Tagging, categorization

**Outcome Status**:
A derived label for a completed trade's result: win, loss, or breakeven.
_Avoid_: Lifecycle status, open status, planned status

**R Multiple**:
The user-entered signed outcome multiple for a completed trade, displayed like `+2R` or `-2R`. Realized P&L is calculated as risk dollars multiplied by R multiple, and valid values range from `-50R` to `+50R`.
_Avoid_: Risk-reward ratio when referring to realized outcomes

**Realized P&L**:
The dollar outcome of a completed trade, calculated from risk dollars and R multiple. Dense table cells may show whole dollars, while detail views show cents.
_Avoid_: Manually entered P&L

**Risk Dollars**:
The positive dollar amount the user risked on a completed futures trade. It may include cents.
_Avoid_: Contracts, quantity, shares, lots

**Entry Time**:
The user-entered date and time when the completed trade was entered in the market.
_Avoid_: Log date, created date

**Entry-Time Range**:
A selected time window for filtering completed trades by Entry Time, using presets such as all time, trailing 30 days, trailing 90 days, or year to date.
_Avoid_: Current range, created-date range, live-position range

**Futures Symbol**:
The futures instrument symbol for a completed trade. The UI suggests known futures symbols while the user types, but the trade stores the entered symbol as normalized text.
_Avoid_: Stock ticker, asset type

**Futures Symbol Catalog**:
The curated list of futures symbols used for autocomplete, grouped by market category such as equity indices, interest rates, energy, metals, currencies, agriculture, livestock, and crypto futures.
_Avoid_: Symbol enum, asset selector

**Direction**:
The side of a completed futures trade, either long or short.
_Avoid_: Buy/sell
