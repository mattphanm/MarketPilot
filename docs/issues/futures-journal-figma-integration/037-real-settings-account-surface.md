## Parent

docs/marketpilot-settings-profile-prd.md

## What to build

Turn Settings into a real two-tab surface: Profile and Account. Account should show only real read-only account, provider, verification, workspace, and sign-out behavior, while placeholder Settings areas are removed or deferred so no fake controls appear.

## Acceptance criteria

- [ ] Settings contains only Profile and Account tabs.
- [ ] Settings uses the tabbed/sub-sidebar visual direction while keeping every visible tab backed by real behavior.
- [ ] Account shows read-only email, provider/account information, email verification status, and workspace summary.
- [ ] Account includes sign-out through a confirmation dialog.
- [ ] Confirmation copy is simple, with Cancel and Sign out actions.
- [ ] Notifications is removed from Settings.
- [ ] Appearance is not shown before a real theme system exists.
- [ ] Billing is not shown before payment behavior exists.
- [ ] Connections is not shown before broker integrations are designed.
- [ ] Security is not a separate Settings tab; provider-owned security details only appear under Account when they reflect real account state.
- [ ] Delete Account is not introduced in this pass.
- [ ] Avatar upload is not introduced in this pass.
- [ ] Tests or verification prove removed Settings tabs and placeholder controls are not present.

## Blocked by

- docs/issues/futures-journal-figma-integration/036-settings-profile-editing.md
