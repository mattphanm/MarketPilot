# Derive outcome metrics from risk and R

MarketPilot stores risk dollars and the user-entered R multiple as the core outcome inputs. Realized P&L is derived as `riskDollars * rMultiple`, and outcome status is derived from the resulting P&L, so edits cannot leave persisted outcome metrics stale.
