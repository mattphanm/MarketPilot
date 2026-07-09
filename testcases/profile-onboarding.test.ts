import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isProfileComplete,
  suggestDisplayName,
  suggestUsername,
} from "../lib/profile/types";
import {
  ProfileSchema,
  buildUnavailableUsernameSuggestions,
} from "../lib/validations/profile";

const pageSource = readFileSync("app/page.tsx", "utf8");
const shellSource = readFileSync("app/components/trade-journal.tsx", "utf8");
const routeSource = readFileSync("app/api/profile/route.ts", "utf8");

describe("required profile onboarding happy path", () => {
  it("derives profile completion from persisted profile fields", () => {
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete({ displayName: "", username: "mp", bio: "" })).toBe(false);
    expect(isProfileComplete({ displayName: "Matt", username: "", bio: "" })).toBe(false);
    expect(isProfileComplete({ displayName: "Matt", username: "matt", bio: "" })).toBe(true);
  });

  it("builds editable suggestions from provider and email data", () => {
    expect(
      suggestDisplayName({ providerName: "  Matt Phan  ", email: "ignored@example.com" })
    ).toBe("Matt Phan");
    expect(
      suggestDisplayName({ providerName: "", email: "futures.trader@example.com" })
    ).toBe("Futures Trader");
    expect(suggestUsername("futures.trader-test@example.com")).toBe(
      "futures_trader_test"
    );
  });

  it("loads persisted profile state with the server-rendered authenticated shell", () => {
    expect(pageSource).toContain("profile: {");
    expect(pageSource).toContain("const initialProfile = serializeProfile(dbUser?.profile ?? null)");
    expect(pageSource).toContain("initialProfileComplete={isProfileComplete(initialProfile)}");
    expect(pageSource).toContain("suggestedDisplayName={suggestDisplayName({");
    expect(pageSource).toContain("suggestedUsername={suggestUsername(session.user?.email)}");
  });

  it("blocks the real authenticated shell until the required profile is saved", () => {
    expect(shellSource).toContain("initialProfile: InitialProfile");
    expect(shellSource).toContain("const [profileComplete, setProfileComplete] = useState(");
    expect(shellSource).toContain("!profileComplete ? (");
    expect(shellSource).toContain("<ProfileOnboardingDialog");
    expect(shellSource).toContain('fetch("/api/profile", {');
    expect(shellSource).toContain("setProfileComplete(true)");
  });

  it("uses one authenticated idempotent profile save endpoint", () => {
    expect(routeSource).toContain("export async function PUT(request: Request)");
    expect(routeSource).toContain("const user = await requireUser()");
    expect(routeSource).toContain("prisma.profile.upsert");
    expect(routeSource).toContain("where: { userId: user.userId }");
    expect(routeSource).toContain("displayName: true");
    expect(routeSource).toContain("username: true");
    expect(routeSource).toContain("bio: true");
  });
});

describe("authoritative profile validation and errors", () => {
  it("validates and normalizes accepted profile input", () => {
    const result = ProfileSchema.safeParse({
      displayName: "  Futures Trader  ",
      username: "Futures_Trader",
      bio: "  Opening range specialist.  ",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual({
      displayName: "Futures Trader",
      username: "futures_trader",
      bio: "Opening range specialist.",
    });
  });

  it("normalizes blank and omitted bio to no bio", () => {
    expect(
      ProfileSchema.parse({
        displayName: "Matt",
        username: "matt_phan",
        bio: "   ",
      }).bio
    ).toBe("");
    expect(
      ProfileSchema.parse({
        displayName: "Matt",
        username: "matt_phan",
      }).bio
    ).toBe("");
  });

  it("rejects invalid display names, usernames, reserved names, and long bios", () => {
    expect(
      ProfileSchema.safeParse({
        displayName: "   ",
        username: "valid_name",
      }).success
    ).toBe(false);
    expect(
      ProfileSchema.safeParse({
        displayName: "A display name that is too long",
        username: "valid_name",
      }).success
    ).toBe(false);
    expect(
      ProfileSchema.safeParse({
        displayName: "Matt",
        username: "ma",
      }).success
    ).toBe(false);
    expect(
      ProfileSchema.safeParse({
        displayName: "Matt",
        username: "name-with-dash",
      }).success
    ).toBe(false);
    expect(
      ProfileSchema.safeParse({
        displayName: "Matt",
        username: "settings",
      }).success
    ).toBe(false);
    expect(
      ProfileSchema.safeParse({
        displayName: "Matt",
        username: "valid_name",
        bio: "x".repeat(281),
      }).success
    ).toBe(false);
  });

  it("keeps server-side validation authoritative with existing error shapes", () => {
    expect(routeSource).toContain('{ error: "Bad request" }');
    expect(routeSource).toContain('{ error: "Invalid profile input", issues: result.error.issues }');
    expect(routeSource).toContain('message: "That username is unavailable."');
    expect(routeSource).toContain('message: "That username is reserved."');
    expect(routeSource).toContain("caught.code === \"P2002\"");
    expect(routeSource).toContain("{ status: 409 }");
  });

  it("shows field-level onboarding errors and prevents duplicate saves", () => {
    expect(shellSource).toContain("type ProfileFieldErrors");
    expect(shellSource).toContain("setProfileFieldErrors(result.fieldErrors)");
    expect(shellSource).toContain("getProfileFieldErrors(body?.issues)");
    expect(shellSource).toContain("fieldErrors.displayName");
    expect(shellSource).toContain("fieldErrors.username");
    expect(shellSource).toContain("disabled={saving}");
  });
});

describe("unavailable username suggestions", () => {
  it("builds up to three bounded suffix suggestions and skips unavailable names", () => {
    expect(
      buildUnavailableUsernameSuggestions(
        "futures",
        new Set(["futures_2", "futures_4"])
      )
    ).toEqual(["futures_3", "futures_5", "futures_6"]);
    expect(
      buildUnavailableUsernameSuggestions(
        "abcdefghijklmnopqrstuvw",
        new Set(),
        { maxSuffix: 4 }
      )
    ).toEqual([]);
    expect(
      buildUnavailableUsernameSuggestions(
        "taken",
        new Set(["taken_2", "taken_3", "taken_4"]),
        { maxSuffix: 4 }
      )
    ).toEqual([]);
  });

  it("returns profile username conflicts as 409 responses with suggestions", () => {
    expect(routeSource).toContain("ProfileInputSchema.safeParse");
    expect(routeSource).toContain("getUsernameAvailabilityIssue");
    expect(routeSource).toContain("prisma.profile.findMany");
    expect(routeSource).toContain("buildUnavailableUsernameSuggestions");
    expect(routeSource).toContain("suggestions: usernameAvailability.suggestions");
    expect(routeSource).toContain("existingSubmittedUsername.userId !== userId");
  });

  it("renders username suggestions as clickable options without auto-replacing failed input", () => {
    expect(shellSource).toContain("profileUsernameSuggestions");
    expect(shellSource).toContain("getProfileUsernameSuggestions(body?.issues)");
    expect(shellSource).toContain("usernameSuggestions.map((suggestion)");
    expect(shellSource).toContain('type="button"');
    expect(shellSource).toContain('onClick={() => onUpdateForm("username", suggestion)}');
    expect(shellSource).not.toContain("setProfileForm(body.profile");
  });
});

describe("authenticated shell blocking profile coverage", () => {
  it("server-renders direct-link authenticated views with incomplete profile state", () => {
    expect(pageSource).toContain("const initialView = parseDashboardView(resolvedSearchParams?.view)");
    expect(pageSource).toContain("key={initialView}");
    expect(pageSource).toContain("initialView={initialView}");
    expect(pageSource).toContain("initialProfile={initialProfile}");
    expect(pageSource).toContain("initialProfileComplete={isProfileComplete(initialProfile)}");
  });

  it("keeps the authenticated shell mounted but inert while onboarding blocks it", () => {
    expect(shellSource).toContain('className="contents"');
    expect(shellSource).toContain("aria-hidden={!profileComplete}");
    expect(shellSource).toContain("inert={!profileComplete}");
    expect(shellSource).toContain("<Sidebar");
    expect(shellSource).toContain("<TopBar");
    expect(shellSource).toContain('data-testid="authenticated-shell-scroll-container"');
    expect(shellSource).toContain("!profileComplete ? (");
    expect(shellSource).toContain("<ProfileOnboardingDialog");
  });

  it("renders onboarding as a non-dismissible modal dialog", () => {
    const onboardingDialogSource = shellSource.slice(
      shellSource.indexOf("function ProfileOnboardingDialog"),
      shellSource.indexOf("function AppCard")
    );

    expect(onboardingDialogSource).toContain('role="dialog"');
    expect(onboardingDialogSource).toContain('aria-modal="true"');
    expect(onboardingDialogSource).toContain('aria-labelledby="profile-onboarding-title"');
    expect(onboardingDialogSource).toContain('className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-3 sm:p-4"');
    expect(onboardingDialogSource).not.toContain("onCancel={");
    expect(onboardingDialogSource).not.toContain("onClose={");
    expect(onboardingDialogSource).not.toContain("Escape");
  });

  it("traps keyboard focus inside onboarding until the profile is saved", () => {
    expect(shellSource).toContain("const dialogRef = useRef<HTMLDivElement | null>(null)");
    expect(shellSource).toContain("function trapProfileOnboardingFocus");
    expect(shellSource).toContain('event.key !== "Tab"');
    expect(shellSource).toContain("dialog.querySelectorAll<HTMLElement>");
    expect(shellSource).toContain("document.activeElement === firstControl");
    expect(shellSource).toContain("document.activeElement === lastControl");
    expect(shellSource).toContain("firstControl.focus()");
    expect(shellSource).toContain("lastControl.focus()");
    expect(shellSource).toContain("onKeyDown={trapProfileOnboardingFocus}");
    expect(shellSource).toContain("data-profile-onboarding-initial-focus");
  });

  it("keeps onboarding open and shows exact field-level problems after validation failure", () => {
    expect(shellSource).toContain("const result = buildProfilePayload(profileForm)");
    expect(shellSource).toContain("setProfileFieldErrors(result.fieldErrors)");
    expect(shellSource).toContain("if (!result.payload) {");
    expect(shellSource).toContain("return;");
    expect(shellSource).toContain("const fieldErrors = getProfileFieldErrors(body?.issues)");
    expect(shellSource).toContain("setProfileFieldErrors(fieldErrors)");
    expect(shellSource).toContain("fieldErrors.displayName");
    expect(shellSource).toContain("fieldErrors.username");
    expect(shellSource).toContain("profile-display-name-error");
    expect(shellSource).toContain("profile-username-error");
  });

  it("successful onboarding closes the modal without redirecting away from the current view", () => {
    const profileSubmitSource = shellSource.slice(
      shellSource.indexOf("async function handleProfileSubmit"),
      shellSource.indexOf("async function handleSubmit")
    );

    expect(profileSubmitSource).toContain("setProfile(body.profile)");
    expect(profileSubmitSource).toContain("setProfileComplete(true)");
    expect(profileSubmitSource).toContain("setProfileForm({");
    expect(profileSubmitSource).not.toContain("navigateToView(");
    expect(profileSubmitSource).not.toContain("router.replace(");
    expect(profileSubmitSource).not.toContain("window.location");
  });
});


describe("settings profile editing", () => {
  it("renders Settings Profile as the editable home for app-owned identity", () => {
    const settingsSource = shellSource.slice(
      shellSource.indexOf("function SettingsView"),
      shellSource.indexOf("function TradeLogView")
    );

    expect(settingsSource).toContain("<SectionTitle>Profile</SectionTitle>");
    expect(settingsSource).toContain("value={profileForm.displayName}");
    expect(settingsSource).toContain("value={profileForm.username}");
    expect(settingsSource).toContain("value={profileForm.bio}");
    expect(settingsSource).toContain("onSubmit={onSubmitProfile}");
    expect(settingsSource).toContain("Username");
    expect(settingsSource).not.toContain("public");
  });

  it("reuses onboarding validation, field errors, and authenticated save behavior", () => {
    expect(shellSource).toContain(
      'import { ProfileInputSchema } from "@/lib/validations/profile"'
    );
    expect(shellSource).toContain("const result = ProfileInputSchema.safeParse(form)");
    expect(shellSource).toContain('field === "displayName" ||');
    expect(shellSource).toContain('field === "username" ||');
    expect(shellSource).toContain('field === "bio"');
    expect(shellSource).toContain("const result = buildProfilePayload(profileForm)");
    expect(shellSource).toContain('fetch("/api/profile", {');
    expect(shellSource).toContain('method: "PUT"');
  });

  it("normalizes blank bio through the shared profile schema", () => {
    expect(
      ProfileSchema.parse({
        displayName: "Matt",
        username: "matt_phan",
        bio: "",
      }).bio
    ).toBe("");
  });

  it("updates shell identity from the saved profile without a full page refresh", () => {
    expect(shellSource).toContain("const displayName =");
    expect(shellSource).toContain(
      'profile?.displayName || userName || userEmail || "Authenticated trader"'
    );
    expect(shellSource).toContain("setProfile(body.profile)");
    expect(shellSource).toContain("userName={displayName}");
    const profileSubmitSource = shellSource.slice(
      shellSource.indexOf("async function handleProfileSubmit"),
      shellSource.indexOf("async function handleSubmit")
    );

    expect(profileSubmitSource).not.toContain("window.location");
  });

  it("shows Settings save feedback and disables duplicate saves", () => {
    expect(shellSource).toContain("profileSuccess");
    expect(shellSource).toContain('setProfileSuccess("Profile saved")');
    expect(shellSource).toContain("disabled={profileSaving}");
    expect(shellSource).toContain(
      '{profileSaving ? "Saving" : "Save Profile"}'
    );
  });
});

describe("real settings account surface", () => {
  it("keeps Settings limited to real Profile and Account tabs", () => {
    const settingsSource = shellSource.slice(
      shellSource.indexOf("function SettingsView"),
      shellSource.indexOf("function TradeLogView")
    );

    expect(shellSource).toContain('type SettingsTab = "profile" | "account"');
    expect(settingsSource).toContain('{ id: "profile", label: "Profile" }');
    expect(settingsSource).toContain('{ id: "account", label: "Account" }');
    expect(settingsSource).toContain('aria-label="Settings sections"');
    expect(settingsSource).not.toContain("Notifications");
    expect(settingsSource).not.toContain("Appearance");
    expect(settingsSource).not.toContain("Billing");
    expect(settingsSource).not.toContain("Connections");
    expect(settingsSource).not.toContain("Security");
    expect(settingsSource).not.toContain("Delete Account");
    expect(settingsSource).not.toContain("Avatar");
  });

  it("shows only server-backed read-only account and workspace facts", () => {
    expect(pageSource).toContain("providerAccountId: true");
    expect(pageSource).toContain("accountProviderAccountId={account?.providerAccountId}");

    const settingsSource = shellSource.slice(
      shellSource.indexOf("function SettingsView"),
      shellSource.indexOf("function TradeLogView")
    );

    expect(settingsSource).toContain('["Email", userEmail ?? "No email available"]');
    expect(settingsSource).toContain('["Sign-in provider", providerLabel]');
    expect(settingsSource).toContain(
      '["Provider account", accountProviderAccountId ?? "Not available"]'
    );
    expect(settingsSource).toContain('["Account type", accountType ?? "Not available"]');
    expect(settingsSource).toContain('["Email status", emailStatus]');
    expect(settingsSource).toContain("<SectionTitle>Workspace Summary</SectionTitle>");
    expect(settingsSource).toContain('["Total Trades", numberFormatter.format(trades.length)]');
    expect(settingsSource).toContain('["Playbooks", numberFormatter.format(playbooks.length)]');
  });

  it("routes Account sign-out through a simple confirmation dialog", () => {
    expect(shellSource).toContain("function SignOutDialog");
    expect(shellSource).toContain('aria-labelledby="sign-out-title"');
    expect(shellSource).toContain("Sign out?");
    expect(shellSource).toContain("Cancel");
    expect(shellSource).toContain("<form action={signOutUser}>");
    expect(shellSource).toContain("onRequestSignOut={() => setSignOutConfirmOpen(true)}");
    expect(shellSource).toContain("signOutConfirmOpen ? (");
    expect(shellSource).toContain("<SignOutDialog");
  });
});
