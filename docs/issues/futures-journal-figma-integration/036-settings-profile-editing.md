## Parent

docs/marketpilot-settings-profile-prd.md

## What to build

Add Settings > Profile as the editable home for a trader's app-owned identity. Traders should be able to edit display name, username, and optional bio using the same validation and save behavior as onboarding, then see shell identity update immediately without a full page refresh.

## Acceptance criteria

- [ ] Settings > Profile lets authenticated traders edit display name, username, and bio.
- [ ] Settings > Profile uses the same authenticated profile save endpoint as onboarding.
- [ ] Settings > Profile reuses the same field-level error model as onboarding.
- [ ] Username remains required in Settings so profile completion cannot be undone.
- [ ] Bio remains optional in Settings.
- [ ] Blank bio input is saved as no bio.
- [ ] A valid Settings/Profile save updates sidebar and account-menu display identity immediately.
- [ ] Settings/Profile saves show success feedback.
- [ ] Save buttons are disabled while submitting.
- [ ] Shell display name precedence is persisted profile display name, then provider/session name, then email, then `Authenticated trader`.
- [ ] Avatar display continues to use provider image or initials fallback.
- [ ] Username is shown in Settings/Profile only and does not imply a public-handle workflow.
- [ ] Tests cover Settings/Profile validation reuse, save success, blank bio normalization, and immediate displayed-identity updates.

## Blocked by

- docs/issues/futures-journal-figma-integration/034-unavailable-username-suggestions.md
- docs/issues/futures-journal-figma-integration/035-authenticated-shell-blocking-coverage.md
