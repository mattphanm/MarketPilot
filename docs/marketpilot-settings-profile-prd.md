# MarketPilot Settings and Profile PRD

## Problem Statement

MarketPilot currently has a Settings surface that exposes account and workspace information, but it does not yet have a persisted app-owned profile. The authenticated shell still relies on provider identity data, and the Settings experience cannot let a trader set the display name, username, or bio that MarketPilot should use inside the product.

This creates two product problems. First, identity inside the trading journal is not owned by the app, so MarketPilot cannot reliably support future public-profile or sharing workflows. Second, Settings risks drifting into placeholder UI if tabs like Billing, Connections, Notifications, Appearance, or Security are shown before they have real product behavior.

The new design intentionally changes the earlier Settings direction. The earlier direction was to expose only real account, sign-out, and workspace information. This PRD keeps that no-fake-controls rule, but expands Settings into a real persisted Profile system.

## Solution

Add a persisted MarketPilot profile system for authenticated users. Each user can save an app-owned display name, globally unique username, and optional bio. A profile is created only when the user submits onboarding or Settings > Profile, not automatically at sign-in.

Authenticated users who do not have a complete profile must finish a blocking onboarding modal before interacting with any authenticated view. The modal appears over the real authenticated shell, is not dismissible, traps focus, and requires only display name and username. Bio remains optional and belongs in Settings > Profile after onboarding.

Settings becomes a real two-tab surface: Profile and Account. Profile contains editable app profile fields. Account contains read-only auth/account/workspace information and sign-out through a confirmation dialog. Top-right and sidebar-bottom profile triggers open the same account menu. The sidebar-bottom profile row is clickable across the full row.

The feature uses one authenticated profile save endpoint. Initial profile state is loaded server-side with the authenticated shell and passed into the client shell so incomplete users cannot interact before the onboarding modal appears.

## User Stories

1. As an authenticated trader, I want MarketPilot to ask me to complete my profile when required fields are missing, so that the app has reliable identity data.
2. As an authenticated trader, I want profile completion to block every authenticated view, so that I cannot accidentally use the app in a partially configured state.
3. As an authenticated trader following a direct link, I want incomplete profile state to block that view too, so that deep links do not bypass onboarding.
4. As an authenticated trader, I want onboarding to appear over the real app shell, so that I understand I am signed in but need to finish setup.
5. As an authenticated trader, I want onboarding to be non-dismissible, so that required profile data is collected before app interaction.
6. As a keyboard user, I want onboarding focus to stay inside the modal, so that I can complete the required fields predictably.
7. As an authenticated trader, I want onboarding to ask only for display name and username, so that setup is quick.
8. As an authenticated trader, I want bio to be omitted from onboarding, so that optional profile polish does not block first use.
9. As an authenticated trader, I want my display name prefilled from provider identity when available, so that setup starts with a useful suggestion.
10. As an authenticated trader, I want my display name suggestion to fall back to a cleaned email local part, so that setup still has a sensible default.
11. As an authenticated trader, I want my username prefilled from my email local part when possible, so that I can start from a readable handle.
12. As an authenticated trader, I want prefilled values to remain editable suggestions, so that I explicitly choose what gets saved.
13. As an authenticated trader, I want to review and click Save before profile data becomes final, so that suggestions are not silently persisted.
14. As an authenticated trader, I want username format feedback while typing, so that I can fix obvious errors before submit.
15. As an authenticated trader, I want display name validation while typing, so that blank or too-long values are caught early.
16. As an authenticated trader, I want the server to be the final authority on profile validation, so that client-side checks cannot be bypassed.
17. As an authenticated trader, I want a clear error if a username is unavailable, so that I know to choose another handle.
18. As an authenticated trader, I want unavailable username suggestions, so that I can quickly choose a valid alternative.
19. As an authenticated trader, I want username suggestions to be clickable, so that I can apply one without retyping it.
20. As an authenticated trader, I do not want the app to automatically replace my username field, so that I stay in control of the submitted handle.
21. As an authenticated trader, I want reserved usernames to show clear copy, so that I understand product/system words cannot be used.
22. As an authenticated trader, I want generic unavailable copy for taken usernames, so that the product does not expose unnecessary account details.
23. As an authenticated trader, I want the onboarding modal to stay open when validation fails, so that I can correct the exact fields.
24. As an authenticated trader, I want field-level errors for display name and username, so that each problem is tied to the relevant input.
25. As an authenticated trader, I want unexpected save failures to show a compact global error, so that I know the save did not complete.
26. As an authenticated trader, I want onboarding to close after a successful save, so that I can continue to the view I was already trying to use.
27. As an authenticated trader, I want successful onboarding to keep my current view, so that completing setup does not redirect me unnecessarily.
28. As an authenticated trader, I want Settings > Profile to let me edit display name, username, and bio, so that I can maintain my app-owned profile.
29. As an authenticated trader, I want Settings > Profile to reuse onboarding validation behavior, so that profile saves feel consistent.
30. As an authenticated trader, I want username to remain required in Settings, so that profile completion cannot be undone.
31. As an authenticated trader, I want bio to be optional in Settings, so that I can leave it blank.
32. As an authenticated trader, I want blank bio input to be saved as no bio, so that empty text is not treated as meaningful data.
33. As an authenticated trader, I want Settings saves to update the sidebar and account menu immediately, so that I see my new display name without a page reload.
34. As an authenticated trader, I want Settings saves to show success feedback, so that I know the update completed.
35. As an authenticated trader, I want save buttons disabled while submitting, so that duplicate profile requests are avoided.
36. As an authenticated trader, I want the app shell to use my saved profile display name when available, so that MarketPilot identity is app-owned.
37. As an authenticated trader, I want provider image or initials fallback to keep working, so that my avatar display remains useful without upload support.
38. As an authenticated trader, I want username shown in Settings/Profile only for now, so that a future public-handle workflow is not implied yet.
39. As an authenticated trader, I want the top-right profile trigger to be avatar or initials only, so that the top bar stays compact.
40. As an authenticated trader, I want the separate top-bar Sign out button removed, so that sign-out lives consistently in the account menu.
41. As an authenticated trader, I want the top-right profile trigger to open an account menu, so that Settings and Sign out are reachable from identity UI.
42. As an authenticated trader, I want the sidebar-bottom profile row to open the same account menu, so that identity actions are consistent.
43. As an authenticated trader, I want the full sidebar-bottom profile row clickable, so that the target is easy to hit.
44. As an authenticated trader, I want the sidebar-bottom row to show display name and email, so that I can identify the signed-in account.
45. As an authenticated trader, I want account menu Sign out to open a confirmation dialog, so that I do not sign out accidentally.
46. As an authenticated trader, I want confirmation copy to be simple, so that the action is clear.
47. As an authenticated trader, I want the account menu to close on outside click and Escape, so that it behaves like a normal menu.
48. As an authenticated trader, I want Settings to include only Profile and Account tabs, so that every visible tab is real.
49. As an authenticated trader, I want Notifications removed from Settings, so that no fake notification preferences appear.
50. As an authenticated trader, I want Appearance deferred, so that theme controls do not appear before the app has a real theme system.
51. As an authenticated trader, I want Billing deferred, so that payment controls are not implied before billing exists.
52. As an authenticated trader, I want Connections deferred, so that broker integrations are not implied before they are designed.
53. As an authenticated trader, I want Security not to be a separate Settings tab, so that Google-controlled password and 2FA behavior is not misrepresented.
54. As an authenticated trader, I want Delete Account deferred, so that destructive data deletion gets its own careful design.
55. As an authenticated trader, I want avatar upload deferred, so that the first profile pass is not blocked by storage design.
56. As a product maintainer, I want profile data separate from auth-owned user data, so that auth integration and app profile concerns do not become tangled.
57. As a product maintainer, I want profile completion derived from stored data, so that there is no separate boolean that can drift.
58. As a product maintainer, I want one idempotent profile save endpoint, so that onboarding and Settings use the same persistence contract.
59. As a product maintainer, I want initial profile state loaded with the server-rendered shell, so that incomplete-profile blocking cannot flash late.
60. As an implementation agent, I want the profile API to follow the app's existing error shape, so that client error handling stays consistent.
61. As an implementation agent, I want tests around validation, API auth, conflicts, onboarding blocking, and menu behavior, so that the feature is safe to implement across schema, API, and UI.

## Implementation Decisions

- Add a separate app-owned `UserProfile` persistence model rather than adding profile fields directly to the auth-owned user model.
- The profile model stores a unique owning user reference, `displayName`, `username`, optional `bio`, and timestamps.
- `displayName` is required, trimmed server-side, rejected if blank after trim, and limited to 25 characters.
- `username` is required, app-owned, globally unique, normalized to lowercase, stored only in normalized form, and editable after profile completion.
- Username rules are lowercase letters, numbers, and underscores only, with length from 3 to 24 characters.
- Unsupported submitted username characters are validation errors. Email-derived username suggestions may convert unsupported separators to underscores so the suggestion remains readable.
- Store only the normalized lowercase username. Do not store a separate original-casing field.
- `bio` is optional, limited to 280 characters, and blank input is normalized to `null`.
- Add a short reserved username list for obvious product/system words, including `settings`, `admin`, `api`, `login`, and `marketpilot`.
- Profile completion is derived, not stored as a separate boolean.
- A profile is incomplete when no profile exists, display name is blank, or username is blank.
- Existing signed-in users without a profile are not backfilled. They see the blocking onboarding modal on their next authenticated visit.
- Profile records are created when the user submits onboarding or Settings/Profile, not automatically at sign-in.
- Load the initial persisted profile and derived completion state server-side with the authenticated shell.
- Pass a single serializable `initialProfile` object and a derived `isProfileComplete` boolean into the client shell.
- `initialProfile` contains only persisted profile fields. Provider/session fallback identity values remain separate account/session props.
- Compute onboarding prefill suggestions client-side from account/session props. Suggestions are editable and not saved until submit.
- Display name precedence in shell identity is persisted profile display name, then provider/session name, then email, then `Authenticated trader`.
- Keep username distinct from display name. Display name is friendly UI identity; username is the unique handle.
- Use one authenticated idempotent profile save endpoint for onboarding and Settings/Profile.
- The profile save endpoint upserts the current authenticated user's profile.
- Do not add a profile read endpoint in the first pass. Initial data comes from server-side shell loading, and saves return the updated UI-needed profile.
- The profile save endpoint returns only `displayName`, `username`, and `bio` on success.
- The client uses the returned profile to update local shell and form state immediately. Do not require a full page refresh after save.
- The endpoint is guarded by the existing authenticated-user boundary.
- The endpoint follows the existing `{ error, issues }` error pattern, where issues include field paths and messages.
- Invalid JSON returns a generic bad-request error.
- Validation failures return `400` with field-level issues.
- Username availability conflicts return `409` with a username issue and suggestions.
- Taken-username copy should be generic, such as `That username is unavailable.`
- Reserved-username copy should be distinct, such as `That username is reserved.`
- Username suggestions are generated only when the normalized submitted username is otherwise valid but unavailable.
- Return up to three available username suggestions.
- Suggestions use simple suffixes like `_2`, `_3`, and `_4`, skip taken and reserved names, and may search up to a bounded suffix such as `_20`.
- The client shows suggestions as clickable options and does not auto-replace the username field.
- Do not add a separate username availability-check endpoint in this pass.
- Do not add dedicated rate limiting in this pass. Keep the endpoint authenticated-only and avoid exposing account details beyond username availability.
- Client-side validation should catch obvious required, length, and username format issues.
- Server-side validation remains authoritative for trimming, normalization, reserved usernames, and uniqueness.
- Onboarding renders the authenticated shell behind a blocking modal overlay.
- Onboarding is non-dismissible, traps focus, and prevents app interaction until required fields are saved.
- Incomplete profile blocks every authenticated view, including direct links.
- Onboarding asks only for display name and username.
- Bio belongs in Settings/Profile, not onboarding.
- After onboarding save succeeds, keep the user on the current view rather than navigating to Settings/Profile.
- Failed onboarding saves keep the modal open and show field-level errors, with compact global copy only for unexpected failures.
- Settings/Profile uses the same validation and save endpoint as onboarding.
- Settings/Profile includes display name, username, and optional bio.
- Settings/Profile reuses the same field-level error model as onboarding.
- Settings/Profile saves show success feedback after a valid save.
- Save buttons disable while submitting.
- Settings uses the tabbed/sub-sidebar visual direction from the sample, but only with real tabs.
- Immediate Settings tabs are Profile and Account.
- Account contains read-only email, provider/account information, email verification status, workspace summary, and sign-out.
- Notifications, Security, Billing, Connections, and Appearance are not immediate Settings tabs.
- Security-specific account details stay under Account only when they reflect real provider/account state.
- Upgrade the existing top-right initials/avatar control into a real account-menu button.
- Do not add a second top-right profile icon.
- Top-right account trigger shows avatar/provider image when present, otherwise initials.
- Top-right account trigger shows avatar/initials only, without name text.
- Remove the separate top-bar Sign out button.
- Sidebar-bottom profile uses the same avatar/provider image or initials fallback.
- Sidebar-bottom profile shows display name and email.
- The full sidebar-bottom profile row opens the same account menu as the top-right trigger.
- A small chevron/menu cue may be added only if it fits cleanly.
- Account menu contents are user name/email, Settings, and Sign out.
- Account-menu Settings opens Settings/Profile.
- Sign out opens a confirmation dialog instead of signing out immediately.
- Confirmation copy can be simple: `Sign out of MarketPilot?`, with Cancel and Sign out actions.
- Menus close on outside click and Escape.
- Remove the sidebar `Futures Journal` bar because it looks like a workspace switcher without real workspace switching.
- Add a new ADR that references the existing Settings ADR and records the new persisted profile direction.
- Before implementing Next.js changes, implementation agents must read the relevant local Next.js 16 documentation because this app uses a newer Next.js version than many defaults assume.

## Testing Decisions

- Good tests should verify user-visible behavior and contract behavior, not component-local implementation details.
- The highest-value test boundary is the authenticated profile save contract: auth guard, validation, normalization, upsert behavior, uniqueness conflicts, reserved usernames, and response shape.
- Add focused validation tests for display name trimming, display name length, username normalization, username allowed characters, username length, reserved usernames, optional bio, and blank bio normalization.
- Add suggestion-generation tests for unavailable usernames, including skipping taken/reserved suggestions and bounded suffix search.
- Add API tests or route-level tests for unauthenticated save rejection, invalid JSON, invalid profile input, successful create, successful update, and unique-race conflict handling.
- Add server-loaded shell-state tests or equivalent coverage showing that incomplete profile state is available before client interaction.
- Add UI or shell behavior coverage proving incomplete users see a blocking onboarding modal on every authenticated view, including direct-link initial views.
- Add coverage that onboarding save success closes the modal and keeps the current view.
- Add coverage that onboarding validation failure keeps the modal open and shows field-level errors.
- Add coverage that Settings/Profile uses the same validation model and updates displayed identity after save.
- Add coverage that the top-right account trigger and sidebar-bottom profile row open the same account menu.
- Add coverage that Sign out from the account menu opens a confirmation dialog.
- Add coverage that removed Settings tabs and placeholder controls are not present.
- Existing prior art includes authenticated-shell layout tests, auth boundary tests, trade/playbook API route error shapes, and helper-level domain tests.
- If a full component test harness is not available, use focused logic/API tests plus manual browser verification for focus trapping, account menu behavior, and responsive layout.

## Out of Scope

- Billing settings or payment integration.
- Broker connections or account linking.
- Notifications settings, toggles, delivery preferences, alerts, or inbox behavior.
- Appearance, theme, density, or design-token refactors.
- Password, two-factor authentication, session revocation, or provider-security controls not owned by MarketPilot.
- Delete Account.
- Avatar upload.
- Amazon S3 storage.
- Public profile pages.
- Sharing workflows.
- Username cooldowns, username history, redirects from old usernames, or public-handle abuse tooling.
- A standalone username availability-check endpoint.
- Dedicated rate limiting for profile saves.
- Backfilling existing users with automatic profile records.
- Fake Settings controls or tabs with no real behavior.
- Changing Trade, Trade Journal, Trade Log, Journal Entry, Playbook, Entry-Time Range, Realized P&L, Risk Dollars, R Multiple, Direction, or Futures Symbol behavior.

## Grill Decision Log

1. Settings becomes a real persisted system, not a mock or `useState`-only UI.
2. Billing and broker connections are out of scope and should become separate future issues.
3. Future Billing and Connections work should use the `minor` label and may later add `enhancement` and `ready-for-agent` when specified.
4. Notifications are removed from Settings for now.
5. Appearance/theme/density settings are deferred because the app needs a broader token/theme design first.
6. Security is not a separate tab because Google/NextAuth owns password and 2FA.
7. Delete Account is deferred because destructive data deletion needs its own design.
8. Avatar upload is deferred, with future S3 storage left for a separate issue.
9. Avatar display still uses provider image or initials fallback.
10. Use a separate `UserProfile` table rather than adding app-owned fields directly to the auth user table.
11. `UserProfile` contains a unique user reference, display name, unique username, optional bio, and timestamps.
12. Do not add S3/avatar metadata to the profile model in this pass.
13. Create a profile when the user submits onboarding/profile form, not at sign-in.
14. Derive profile completion from stored data.
15. A missing profile, blank display name, or blank username means the profile is incomplete.
16. Existing signed-in users with no profile see onboarding rather than receiving backfilled records.
17. Onboarding is blocking and non-dismissible until required fields are saved.
18. Onboarding required fields are display name and username.
19. Bio is not part of onboarding.
20. Display name is app-owned, editable, required, not unique, trimmed, max 25 characters, and rejects blank-after-trim.
21. Username is app-owned, globally unique, normalized, editable, required, and reserved for future public-profile/sharing work.
22. Username rules are lowercase `a-z`, `0-9`, underscore, length 3 to 24.
23. Username suggestions may prefill from the email local part.
24. Unsupported separators in suggestions are converted to underscores.
25. Suggestions are not saved until the user clicks Save.
26. If a suggested username is taken, show inline error and keep onboarding open.
27. The server/database is the final authority on uniqueness.
28. Server returns suggestions for taken usernames.
29. Display name suggestions come from provider/session name, then cleaned email local part.
30. The saved app display name replaces current shell user-name usage everywhere.
31. Display name fallback order is profile display name, provider/session name, email, then `Authenticated trader`.
32. Settings uses the sample's tabbed/sub-sidebar direction, but only with real tabs.
33. Immediate Settings tabs are Profile and Account.
34. Profile contains display name, username, and bio.
35. Account contains read-only account/workspace information and sign-out.
36. Upgrade the existing top-right initials icon into an account-menu trigger.
37. Do not add a second top-right profile icon.
38. Top-right trigger shows only avatar/initials.
39. Remove the separate top-bar Sign out button.
40. Sidebar-bottom profile shows display name and email.
41. Top-right profile and sidebar-bottom profile open the same account menu.
42. Account menu contains user name/email, Settings, and Sign out.
43. Sign out opens confirmation.
44. The sidebar `Futures Journal` bar is removed.
45. Sidebar-bottom profile row is clickable across the whole row.
46. Profile saves use authenticated JSON API routes guarded by the existing authenticated-user helper.
47. Use one idempotent profile save endpoint for onboarding and Settings.
48. Username conflicts return suggestions directly, using conflict status.
49. Store only normalized lowercase username.
50. Allow username edits freely for now.
51. Bio is optional, max 280 characters, and blank normalizes to `null`.
52. Add a short reserved username list for obvious system/product words.
53. Onboarding renders over the authenticated shell behind a blocking overlay.
54. Incomplete profile blocks every authenticated view.
55. Successful onboarding keeps the current view.
56. Load initial profile and completion state server-side with the shell.
57. Do not add a profile read endpoint in the first pass.
58. Do not backfill existing users.
59. Use both inline client validation and authoritative server validation.
60. Settings/Profile reuses the onboarding endpoint and validation model.
61. Settings/Profile save updates shell identity immediately from the save response.
62. Pass `initialProfile` plus `isProfileComplete` into the client shell.
63. `initialProfile` includes only persisted profile fields.
64. Onboarding suggestions are computed client-side from account/session props.
65. Username conflict suggestions are clickable and do not auto-replace the field.
66. Reserved usernames use distinct validation copy.
67. Taken-username copy is generic: `That username is unavailable.`
68. Do not add dedicated rate limiting in this pass.
69. Failed onboarding saves keep the modal open with field-level errors.
70. Settings/Profile reuses the same field-level error UI.
71. The save response returns only `displayName`, `username`, and `bio`.
72. Use the returned profile for immediate local UI updates rather than a full refresh.
73. The profile endpoint follows the existing `{ error, issues }` API error pattern.
74. Generate username suggestions only when the normalized username is otherwise valid but unavailable.
75. Return up to three suggestions.
76. Search suffix suggestions up to a small bounded cap such as `_20`.
77. Menus close on outside click and Escape.
78. Save buttons disable while submitting.
79. Tests cover validation, normalization, suggestions, API auth/conflicts, profile upsert, blocking onboarding, direct-link blocking, Settings save, account menu, and sign-out confirmation.
80. Create a new ADR referencing the existing Settings ADR instead of rewriting it.

## Further Notes

- This PRD intentionally supersedes the earlier Settings-only direction while preserving the principle that Settings should expose only real behavior.
- Billing and Connections should be separate future issues, not part of the main Settings/Profile implementation.
- The `minor` label already exists for deferred or lower-priority scope.
- Avoid personal emails or names in implementation examples, test data, documentation, and issues.
