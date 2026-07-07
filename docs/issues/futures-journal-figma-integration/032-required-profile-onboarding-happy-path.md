## Parent

docs/marketpilot-settings-profile-prd.md

## What to build

Build the first complete persisted profile path for authenticated traders. A trader without a complete app-owned profile should see blocking onboarding over the real authenticated shell, receive editable display name and username suggestions, save those required fields through the authenticated profile save contract, and continue on the same view after the modal closes.

Add the persisted profile direction ADR as part of this slice so later profile work has a documented product and technical decision to follow.

## Acceptance criteria

- [ ] Authenticated users can create an app-owned profile with display name and username through one authenticated, idempotent profile save endpoint.
- [ ] Profile records are created only when onboarding or Settings/Profile is submitted, not automatically at sign-in.
- [ ] Profile completion is derived from persisted data: missing profile, blank display name, or blank username means incomplete.
- [ ] Initial persisted profile state and derived completion state are loaded with the server-rendered authenticated shell.
- [ ] The client shell receives a serializable initial profile object containing only persisted profile fields, plus a derived profile-complete boolean.
- [ ] Onboarding appears over the real authenticated shell for incomplete profiles and asks only for display name and username.
- [ ] Display name suggestion comes from provider/session name when available, then a cleaned email local part.
- [ ] Username suggestion comes from the email local part when possible and converts unsupported separators to underscores.
- [ ] Prefilled values remain editable suggestions and are not persisted until the trader explicitly saves.
- [ ] A successful onboarding save closes the modal and keeps the trader on the current view.
- [ ] The profile save success response returns the UI-needed profile fields: display name, username, and bio.
- [ ] A new ADR references the existing Settings ADR and records the persisted app-owned profile direction.

## Blocked by

None - can start immediately.
