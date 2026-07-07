# MarketPilot Settings/Profile Grill Handoff

## Purpose

Continue the Settings/Profile grilling session in a fresh context window, then turn the agreed decisions into a PRD and GitHub/local issues for the `mattphanm/MarketPilot` repo.

Repo path:

`/Users/matthewphan/Documents/Codex-Agentic/Projects/marketpilot`

The user explicitly asked that this handoff preserve every architectural decision made during the grill session.

## Current State

MarketPilot already has a Settings tab that shows real account/workspace data and sign-out. Existing ADR:

`docs/adr/0021-include-figma-settings-tab.md`

That ADR says Settings should only expose real account, sign-out, and workspace information until preference features are intentionally added. During this grill session, the user intentionally changed the direction: Settings/Profile should become a real persisted profile system, not a UI-only mock.

Important repo instruction:

Before coding Next.js changes, read the relevant guide in `node_modules/next/dist/docs/` because this repo uses Next.js `16.2.6`.

## Decisions Made

1. Settings should become a real system, not a mock or `useState`-only UI.

2. Billing and broker connections are out of scope for this implementation. They should become separate future issues.

3. A new GitHub label named `minor` was created with description `Small or deferred scope; lower priority`.

4. Billing and Connections should be two separate future issues, not one combined issue.

5. Future Billing and Connections issues should use the `minor` label. They may also use `enhancement` and `ready-for-agent` once fully specified.

6. Notifications should be removed from Settings entirely for now. No Notifications tab, toggles, saved preferences, or notification delivery behavior in this pass.

7. Appearance/theme/density settings should be deferred. The current UI uses hard-coded Tailwind colors, so a real appearance system would require a broader token/theme refactor.

8. Security should not be a separate tab now. Since auth is Google/NextAuth, MarketPilot does not control password or 2FA. Keep provider/email/sign-out info under Account.

9. Delete Account should be deferred. It needs its own design because it deletes user data, sessions, auth accounts, trades, journal entries, and playbooks.

10. Avatar upload should be deferred. The user plans to use Amazon S3 later, but it is not necessary now.

11. Avatar display should still work with current provider image or initials fallback.

12. S3 avatar upload should become its own future issue later. Do not implement S3 storage in the Settings/Profile pass.

13. Use a separate `UserProfile` table now instead of adding app-owned fields directly to NextAuth's `User` table.

14. Reason for separate `UserProfile`: keeps NextAuth `User` mostly auth-owned, avoids future migration pain, and gives profile room to grow with avatar metadata, public profile, privacy, onboarding timestamps, etc.

15. Suggested `UserProfile` shape:
    - `userId` unique and linked to `User`
    - `displayName`
    - `username` unique
    - `bio`
    - timestamps

16. Do not add S3/avatar fields to `UserProfile` in this pass unless the PRD deliberately includes future-proof nullable metadata. Current working scope is display name, username, and bio.

17. Create `UserProfile` when the user submits onboarding/profile form, not automatically at sign-in.

18. Profile completion state should be derived from stored data, not a separate boolean.

19. A user is profile-incomplete when:
    - no `UserProfile` exists, or
    - `displayName` is blank, or
    - `username` is blank.

20. Existing signed-in users with no `UserProfile` should see the onboarding/profile completion prompt too.

21. The onboarding/profile completion prompt should be blocking and not dismissible until required fields are saved.

22. Onboarding required fields:
    - `displayName`
    - `username`

23. Onboarding should not ask for bio. Bio belongs in Settings > Profile after the user enters the app.

24. Display name should be app-owned and editable.

25. Display name should not be unique.

26. Username should be app-owned, globally unique, normalized, and editable.

27. Username should not be public-facing yet. Reserve it for future public profile/sharing features.

28. Username should be shown in Settings/Profile only for now.

29. Username should be required when saving profile changes.

30. Username should be editable after profile completion, with the same uniqueness and validation rules.

31. Recommended username rules:
    - lowercase only
    - allowed characters: `a-z`, `0-9`, `_`
    - length: 3 to 24 characters
    - globally unique
    - stored normalized server-side

32. Username should prefill from the email local part when possible.

33. Email local part means the characters before `@`.

34. Unsupported username characters and separators should be converted to underscores, not silently dropped, because that keeps suggestions readable.

35. The prefilled username is only a suggestion. It is not reserved or saved until the user submits.

36. If the suggested username is already taken, show inline error and keep the onboarding modal open.

37. The server/database is the final authority on username uniqueness.

38. The app should also suggest simple alternatives when a username is taken, such as appending `_2`, `_3`, `_4`.

39. Display name should prefill from Google/session name if present.

40. If no Google/session name exists, display name can prefill from a cleaned email local part.

41. Display name and username should both be prefilled/editable suggestions, not locked-in decisions.

42. The user must review and click Save before profile data is final.

43. The app profile display name should replace current shell `userName` usage everywhere.

44. Display name precedence:
    - `UserProfile.displayName`
    - session/Google name
    - email
    - `Authenticated trader`

45. Keep username distinct from display name. Display name is friendly UI identity; username is the unique handle.

46. Settings should use the tabbed/sub-sidebar visual direction from the user's sample, but only with real tabs.

47. Immediate Settings tabs:
    - Profile
    - Account

48. Deferred/removed Settings tabs:
    - Notifications
    - Security
    - Billing
    - Connections
    - Appearance

49. Profile tab should contain editable app profile fields:
    - display name
    - username
    - bio

50. Account tab should contain read-only account/workspace information:
    - email
    - Google provider/account info
    - email verification status
    - workspace summary
    - sign-out button with confirmation

51. Top-right profile already exists as a tiny initials icon in the current top bar.

52. Do not add a second top-right profile icon.

53. Upgrade the existing top-right initials icon into a real account-menu button.

54. Top-right account trigger should show avatar/provider image when present, otherwise initials.

55. Top-right account trigger should show initials/avatar only, not initials plus name, because the top bar is tight and already has range controls.

56. Remove the separate `Sign out` button from the top bar.

57. Sidebar-bottom profile should use the same avatar/provider image or initials fallback.

58. Sidebar-bottom profile should show display name and email.

59. Top-right profile and sidebar-bottom profile should open the same account menu/popover.

60. Account menu contents:
    - user name/email
    - Settings
    - Sign out

61. Clicking `Sign out` in the menu should open a confirmation dialog.

62. Do not sign out immediately when the profile trigger is clicked.

63. Confirmation dialog copy can be simple: `Sign out of MarketPilot?`, with Cancel and Sign out actions.

64. The sidebar "Futures Journal" bar near the top should be removed entirely.

65. Reason for removing "Futures Journal": it looks like a workspace switcher, but no real workspace switching exists. The brand, Add Trade button, nav, and bottom profile are enough.

## Pending Grill Question

The last asked question was not answered because the user requested this handoff:

Question 30: Should the sidebar-bottom profile area be clickable across the whole row, or only the avatar/name area?

Recommendation already given:

Make the whole row clickable. It is easier to hit and matches the account-menu behavior. Add a small chevron/menu cue only if it fits compactly.

The next agent should resume from this question unless the user asks to move directly into PRD synthesis.

## Suggested Next Steps

1. Confirm the pending sidebar-bottom click-target decision.

2. Finish any remaining grill questions around validation, API design, migrations, and testing.

3. Write a PRD for the Settings/Profile system.

4. Create one main GitHub issue for the Settings/Profile system.

5. Create two future GitHub issues:
    - Billing integration/settings
    - Broker connections/settings

6. Label the future Billing and Connections issues with `minor`.

7. Consider a new ADR or ADR update because the session intentionally changes the earlier Settings ADR.

## Suggested Skills

- `mattpocock-skills:grilling`: continue the one-question-at-a-time decision interview if needed.
- `mattpocock-skills:to-prd`: synthesize the agreed decisions into a PRD.
- `mattpocock-skills:to-issues`: split the PRD into agent-ready GitHub issues.
- `mattpocock-skills:codebase-design`: useful if the next session needs to refine the `UserProfile` table/API boundaries before implementation.

## Notes For The Next Agent

- The user wants a fresh session to create the PRD and issues after this grill.
- Do not implement billing, broker connections, notifications, appearance, S3 avatar upload, password, 2FA, session revocation, or delete account in the main Settings/Profile issue.
- Do not expose fake controls. Every visible control should either work now or be deferred out of the UI.
- The `minor` GitHub label has already been created.
- Avoid including personal emails or names in generated docs/issues. Use generic examples.
