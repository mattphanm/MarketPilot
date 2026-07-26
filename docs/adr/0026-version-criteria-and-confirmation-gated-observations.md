# Version criteria and require confirmed observations

Approved Playbook Criteria and per-Trade Criterion Observations are versioned records. AI results are cached only for the same Trade evidence hash, assigned Playbook, criterion version, and classifier version, while a trader confirmation or correction supplies the effective state; unconfirmed suggestions remain unverified. Confluences stay as the trader's free text under ADR-0007, with normalized Confluence Signals and observations stored as separate derived records rather than replacing the Journal Entry.
