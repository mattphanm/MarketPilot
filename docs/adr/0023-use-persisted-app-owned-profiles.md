# Use persisted app-owned profiles

MarketPilot will store required trader identity fields in an app-owned Profile record instead of treating provider identity as the product profile. This extends the Settings direction from ADR 0021: Settings can show sign-in account details, but editable product identity belongs to the MarketPilot profile.

Profile records are created only when a trader explicitly submits onboarding or Settings/Profile. Signing in through an auth provider must not create profile data beyond the auth-owned User and Account records.

Profile completion is derived from persisted profile data. A missing Profile, blank display name, or blank username means the authenticated shell is blocked by onboarding. The server-rendered authenticated shell loads the persisted profile fields plus a derived completion boolean, and the client receives only the UI-needed profile fields: display name, username, and bio.

The authenticated profile save contract is idempotent. The same endpoint creates or updates the current user's Profile, scopes ownership from the authenticated session, and returns display name, username, and bio for the shell to update without navigation.
