# Separate semantic classification from outcome analysis

The AI classifier will see only an approved Playbook Criterion and classification-relevant Trade Journal or execution evidence; it will not receive R Multiple, Realized P&L, Outcome Status, or equivalent outcome indicators. MarketPilot freezes confirmed observation states before application code joins outcomes and calculates all counts, comparisons, drift gates, and Evidence Strength. This prevents profitable deviations or losing aligned Trades from biasing semantic review and keeps arithmetic deterministic.
