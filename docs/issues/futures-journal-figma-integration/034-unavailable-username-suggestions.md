## Parent

docs/marketpilot-settings-profile-prd.md

## What to build

Add the unavailable-username branch to the shared profile save flow. When a submitted username is valid but unavailable, the trader should see clear field-level copy and up to three clickable available suggestions without the app automatically replacing the username field.

## Acceptance criteria

- [ ] Username availability conflicts return `409` with a username issue and suggestions.
- [ ] Taken-username copy is generic, such as `That username is unavailable.`
- [ ] Reserved-username copy is distinct, such as `That username is reserved.`
- [ ] Suggestions are generated only when the normalized submitted username is otherwise valid but unavailable.
- [ ] The endpoint returns up to three available username suggestions.
- [ ] Suggestions use simple suffixes such as `_2`, `_3`, and `_4`.
- [ ] Suggestion generation skips taken and reserved names and uses a bounded suffix search.
- [ ] The client renders username suggestions as clickable options.
- [ ] Clicking a suggestion applies it to the username field.
- [ ] The client does not auto-replace the trader's submitted username field after an unavailable response.
- [ ] No standalone username availability-check endpoint is added.
- [ ] Tests cover taken usernames, reserved usernames, skipped suggestions, bounded search, and clickable suggestion behavior.

## Blocked by

- docs/issues/futures-journal-figma-integration/033-authoritative-profile-validation-and-errors.md
