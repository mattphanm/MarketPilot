## Parent

docs/marketpilot-settings-profile-prd.md

## What to build

Prove that incomplete profile state blocks every authenticated view before app interaction is possible. The onboarding modal should behave as a true blocking setup step across normal navigation and direct links, with non-dismissible behavior, focus containment, validation-failure recovery, and successful continuation on the current view.

## Acceptance criteria

- [ ] Incomplete profiles block every authenticated view, including direct-link initial views.
- [ ] Blocking state is available from the server-rendered shell so users do not get an interactive view before onboarding appears.
- [ ] Onboarding is non-dismissible while the profile is incomplete.
- [ ] Focus stays inside the onboarding modal while it is open.
- [ ] The authenticated shell remains visible behind the modal overlay.
- [ ] App interaction behind the modal is prevented until required fields are saved.
- [ ] Validation failure keeps onboarding open and shows the exact field-level problems.
- [ ] Successful onboarding closes the modal without redirecting away from the current view.
- [ ] Coverage exists for direct links, focus trapping, non-dismissible behavior, validation failure, and successful continuation.
- [ ] If full component or browser coverage is not practical, the limitation and manual verification steps are documented clearly for reviewers.

## Blocked by

- docs/issues/futures-journal-figma-integration/032-required-profile-onboarding-happy-path.md
- docs/issues/futures-journal-figma-integration/033-authoritative-profile-validation-and-errors.md

## Coverage note

Automated coverage for this slice is source-level Vitest coverage in `testcases/profile-onboarding.test.ts`. Browser and visual verification are intentionally left manual for reviewers: check direct links for each authenticated `view`, confirm the shell remains visible behind the onboarding overlay, confirm pointer and keyboard interaction behind the modal is blocked, tab through the onboarding controls to verify focus containment, submit invalid values to confirm exact field errors remain visible, and save valid values to confirm the modal closes without changing the current view.
