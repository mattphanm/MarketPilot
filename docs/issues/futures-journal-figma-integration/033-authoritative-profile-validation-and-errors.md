## Parent

docs/marketpilot-settings-profile-prd.md

## What to build

Harden profile saving so client feedback is useful but the server remains authoritative. Traders should get immediate, field-level guidance for obvious display name and username problems, while the save endpoint enforces trimming, normalization, reserved-name rules, uniqueness-safe validation, optional bio behavior, and the app's existing error response shape.

## Acceptance criteria

- [ ] Display name is required, trimmed server-side, rejected when blank after trim, and limited to 25 characters.
- [ ] Username is required, normalized to lowercase, stored only in normalized form, and limited to lowercase letters, numbers, and underscores.
- [ ] Username length is enforced from 3 to 24 characters.
- [ ] Unsupported submitted username characters produce validation errors rather than silent conversion.
- [ ] Bio is optional, limited to 280 characters, and blank input is normalized to no bio.
- [ ] Reserved usernames include at least `settings`, `admin`, `api`, `login`, and `marketpilot`.
- [ ] Client-side validation catches obvious required, length, and username format issues while typing.
- [ ] Validation failures return `400` with field-level issues using the existing `{ error, issues }` pattern.
- [ ] Invalid JSON returns a generic bad-request error.
- [ ] Failed onboarding saves keep the modal open and show field-level errors for the relevant fields.
- [ ] Unexpected save failures show compact global error copy.
- [ ] Save buttons are disabled while submitting to avoid duplicate profile requests.
- [ ] Tests cover validation, normalization, optional bio handling, invalid JSON, unauthenticated rejection, successful create, and successful update.

## Blocked by

- docs/issues/futures-journal-figma-integration/032-required-profile-onboarding-happy-path.md
