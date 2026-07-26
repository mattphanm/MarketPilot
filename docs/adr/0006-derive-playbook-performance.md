# Derive playbook performance from assigned trades

Superseded by ADR-0027 for Official Playbook Performance. Assigned-trade performance remains a separately named comparison.

Playbooks store their definition, not their performance metrics. Win rate, average return, average R multiple, total trades, and best/worst trade are derived from completed trades that reference the playbook so edits to trade logs cannot leave playbook analytics stale.
