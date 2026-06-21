# Use futures symbol autocomplete

MarketPilot uses a curated futures symbol catalog for autocomplete instead of a strict database enum. The first catalog includes the futures symbols named during planning, grouped by category, while trades store the normalized entered symbol so the product can support broker-specific or newly added symbols without a migration.

Users may save symbols that are not present in the autocomplete catalog. Validation checks format and length, not catalog membership.
