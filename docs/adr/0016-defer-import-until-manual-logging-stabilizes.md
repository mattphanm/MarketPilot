# Defer import until manual logging stabilizes

MarketPilot will update manual trade logging before building CSV import. The domain model now requires playbook assignment and journal context, so import should wait until the schema and manual workflow are stable enough to define mapping rules for playbooks, confluences, and trade ideas.
