# Save immutable analysis snapshots with separate freshness

Each completed analysis creates a versioned immutable report snapshot containing its frozen selection, deterministic metrics, evidence references, narrative, completeness, and model/contract audit. Source changes update separate freshness metadata and a later analysis creates a new version instead of rewriting the old report. Account or Trade deletion takes priority over immutability and removes affected private derived data, making an impacted snapshot unavailable or deleting it.
