# Separate journal entries from trades

MarketPilot stores execution facts on `Trade` and reflective content on a one-to-one `JournalEntry`. This keeps analytics focused on completed trade outcomes while allowing thesis, invalidation, lessons, and outcome scoring to evolve as a separate review record.
