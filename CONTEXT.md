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

**Confluence Signal**:
A normalized confirming factor identified in a completed trade's Confluences. Different user phrases may represent the same Confluence Signal.
_Avoid_: Tag, label, keyword

**Expected Confluence Signal**:
A Confluence Signal that a Playbook defines as part of the intended setup and uses as a Playbook Criterion for reviewing completed trades.
_Avoid_: Winning confluence, AI-recommended rule

**Playbook Drift**:
A sustained pattern of completed trades diverging from the required setup conditions or execution triggers defined by their assigned Playbooks.
_Avoid_: Single-trade deviation, strategy failure, losing streak

**Playbook Deviation**:
A confirmed mismatch between one completed trade and a required setup condition or execution trigger in its assigned Playbook.
_Avoid_: Playbook Drift, losing trade, unknown criterion

**Entry Conviction**:
The user's retrospective statement of how strongly the setup appeared to support the trade at Entry Time. It is reflective context, not a measure of AI certainty or the statistical reliability of an analysis finding.
_Avoid_: AI confidence, insight reliability, trade quality

**Playbook**:
A reusable trading model or setup definition that every completed trade must reference.
It stores definition fields such as name, description, individual rules, and presentation color; its performance is derived from completed trades assigned to it.
_Avoid_: Strategy tag, category, playbook tag

**Playbook Rule**:
One setup condition or execution trigger that defines when a completed trade fits a Playbook.
_Avoid_: Bullet, checklist item

**Playbook Criterion**:
One typed item in a Playbook's review baseline, such as an execution rule, risk rule, Expected Confluence Signal, or invalidation. Its type identifies what evidence can determine whether it was satisfied.
_Avoid_: Untyped checklist item, AI-generated score

**Rule Importance**:
The role of a Playbook Criterion in determining alignment: required, supporting, or invalidating. A confirmed missing required criterion or present invalidating criterion creates a Playbook Deviation; a missing supporting criterion does not.
_Avoid_: Weight, AI confidence

**Playbook Alignment**:
The determination that a completed trade satisfies the confirmed required criteria and contains none of the confirmed invalidating criteria in its assigned Playbook.
_Avoid_: Playbook Assignment, winning trade, strategy performance

**Criterion Observation**:
A present, absent, or unknown finding about one Playbook Criterion for one completed Trade. An AI suggestion remains unverified until the trader confirms or corrects it.
_Avoid_: AI score, outcome prediction, automatic fact

**Analysis Run**:
One requested review of a frozen completed-Trade cohort selected by Playbook, Entry-Time Range, or both.
_Avoid_: Live scan, open-position monitor

**Analysis Report**:
An immutable versioned snapshot of a completed Analysis Run, including its cohort counts, deterministic metrics, Evidence Strength, findings, and supporting evidence.
_Avoid_: Live dashboard, mutable summary

**Evidence Strength**:
A Limited, Moderate, or Strong rating of how much confirmed, relevant, and consistent evidence supports an analysis finding.
_Avoid_: AI confidence, prediction probability, Entry Conviction

**Playbook Assignment**:
The required selection of the Playbook a user intended to follow when logging a completed trade. Assignment does not prove Playbook Alignment.
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
