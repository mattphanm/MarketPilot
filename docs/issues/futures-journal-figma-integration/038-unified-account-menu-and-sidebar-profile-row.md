## Parent

docs/marketpilot-settings-profile-prd.md

## What to build

Unify MarketPilot identity actions behind one account menu opened from either the compact top-right avatar/initials trigger or the full sidebar-bottom profile row. The menu should expose identity, Settings, and confirmed sign-out, while removing duplicate or misleading shell controls.

## Acceptance criteria

- [ ] The top-right profile trigger is upgraded into a real account-menu button.
- [ ] No second top-right profile icon is added.
- [ ] The top-right account trigger shows provider image when present, otherwise initials.
- [ ] The top-right account trigger is avatar or initials only, without name text.
- [ ] The separate top-bar Sign out button is removed.
- [ ] The sidebar-bottom profile row shows display name and email.
- [ ] The full sidebar-bottom profile row is clickable and opens the same account menu as the top-right trigger.
- [ ] The sidebar-bottom profile row uses the same provider image or initials fallback as the top-right trigger.
- [ ] The account menu contains user name/email, Settings, and Sign out.
- [ ] Account-menu Settings opens Settings/Profile.
- [ ] Account-menu Sign out opens the shared confirmation dialog instead of signing out immediately.
- [ ] Account menus close on outside click and Escape.
- [ ] The sidebar `Futures Journal` bar is removed.
- [ ] Tests or verification cover both menu triggers, shared menu behavior, outside-click/Escape close, Settings navigation, and sign-out confirmation.

## Blocked by

- docs/issues/futures-journal-figma-integration/036-settings-profile-editing.md
- docs/issues/futures-journal-figma-integration/037-real-settings-account-surface.md
