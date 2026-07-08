import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isProfileComplete,
  suggestDisplayName,
  suggestUsername,
} from "../lib/profile/types";
import { ProfileSchema } from "../lib/validations/profile";

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
    expect(routeSource).toContain('message: "This username is already taken."');
    expect(routeSource).toContain("caught.code === \"P2002\"");
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
