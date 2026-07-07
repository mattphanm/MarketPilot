# MarketPilot Settings/Profile Grill Continuation Handoff

## Purpose

Continue the MarketPilot Settings/Profile grilling session in a fresh context window. The next session should keep asking one implementation-shaping question at a time, then later synthesize the agreed decisions into a PRD and GitHub/local issues.

This document is a continuation of:

`docs/handoffs/marketpilot-settings-profile-grill-handoff-20260706.md`

Do not duplicate that earlier handoff. Treat it as the base decision record, and apply the additional decisions below.

## Repository Context

Repo: MarketPilot workspace at `.../Projects/marketpilot`

Important repo instruction: before coding Next.js changes, read the relevant guide in `node_modules/next/dist/docs/` because this repo uses Next.js `16.2.6`.

Useful files inspected during the continuation:

- `prisma/schema.prisma`: no `UserProfile` model exists yet; NextAuth owns `User`, `Account`, `Session`, and `VerificationToken`.
- `auth.ts`: uses NextAuth with Prisma adapter, Google provider, and database session strategy.
- `lib/auth/require-user.ts`: existing authenticated API helper checks the session user and verifies the user still exists.
- `app/page.tsx`: server-loads session/user data and passes identity props into `TradeJournal`.
- `app/components/trade-journal.tsx`: client component currently owns the app shell and Settings UI, including sign-out controls.
- `app/actions/auth.ts`: has existing `signInWithGoogle` and `signOutUser` server actions.

## Additional Decisions Made

30. Sidebar-bottom profile row should be clickable across the whole row, not just the avatar/name area. A small chevron/menu cue may be added only if it fits cleanly.

31. Profile create/update should use authenticated JSON API routes, guarded by the existing `requireUser()` helper.

32. Use one idempotent `PUT /api/profile` endpoint for both onboarding and Settings profile saves. The endpoint should upsert the current user's `UserProfile`.

33. If a submitted username is taken, the failed `PUT /api/profile` response should return suggestions directly, for example with `409 Conflict` and a suggestions array.

34. Store only the normalized lowercase username in `UserProfile.username`. Do not store a separate original-casing field.

35. Allow username edits freely for now. Future public-profile or sharing work can add friction such as cooldowns, redirects, or history if needed.

36. `bio` is optional, max 280 characters, and blank input should be normalized to `null`.

37. `displayName` is required, trimmed server-side, rejects blank-after-trim, and has a max length of 25 characters.

38. Add a short reserved username list for obvious system/product words such as `settings`, `admin`, `api`, `login`, and `marketpilot`.

39. Onboarding should render the authenticated shell behind a blocking modal overlay. The modal should be non-dismissible, trap focus, and prevent app interaction until required fields are saved.

40. Incomplete profile should block every authenticated view, including direct links such as `?view=trades`.

41. After onboarding profile save succeeds, keep the user on the current view rather than sending them to Settings > Profile.

## Current Stopping Point

The user explicitly stopped after recording Question 41 and asked to save this handoff so grilling can continue in a fresh session.

The next question should continue from Question 42.

Recommended next question:

Question 42: Should the initial profile and profile-completion state be loaded server-side in `app/page.tsx` and passed into `TradeJournal`, or should the client fetch profile state after render?

Recommended answer: load it server-side in `app/page.tsx` and pass it into `TradeJournal`. The shell already receives authenticated identity props there, this avoids a flash where an incomplete user can interact before the modal appears, and the API route can still exist for later client saves/refetches.

## Remaining Decision Areas

Likely remaining grill questions before PRD/issues:

- Exact profile loading contract into the shell.
- Whether `GET /api/profile` is needed immediately or only `PUT /api/profile` plus server-loaded initial data.
- Migration/backfill behavior for existing users.
- Inline validation and error states for onboarding and Settings.
- Account menu and sign-out confirmation details.
- Test scope and acceptance criteria.
- Whether to update ADR 0021 or create a new ADR.

## Suggested Skills

- `mattpocock-skills:grilling`: continue the one-question-at-a-time design interview.
- `mattpocock-skills:codebase-design`: use if the next session needs to refine the `UserProfile` model/API boundary.
- `mattpocock-skills:to-prd`: after grilling is complete, synthesize the agreed decisions into a PRD.
- `mattpocock-skills:to-issues`: after the PRD, create the main implementation issue and future Billing/Connections issues.

## Guardrails For Next Session

- Do not implement yet unless the user explicitly switches from grilling to implementation.
- Do not include Billing, broker connections, notifications, appearance, S3 avatar upload, password, 2FA, session revocation, or delete account in the main Settings/Profile scope.
- Do not expose fake Settings controls.
- Continue asking one question at a time, with a recommended answer for each.
