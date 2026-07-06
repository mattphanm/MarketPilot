export type ProfileDto = {
  displayName: string;
  username: string;
  bio: string;
};

export type InitialProfile = ProfileDto | null;

export function isProfileComplete(profile: InitialProfile) {
  return Boolean(profile?.displayName.trim() && profile.username.trim());
}

export function serializeProfile(
  profile: {
    displayName: string;
    username: string;
    bio: string;
  } | null
): InitialProfile {
  if (!profile) {
    return null;
  }

  return {
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio,
  };
}

export function suggestDisplayName({
  providerName,
  email,
}: {
  providerName?: string | null;
  email?: string | null;
}) {
  const cleanedProviderName = providerName?.trim();

  if (cleanedProviderName) {
    return cleanedProviderName;
  }

  const emailLocalPart = getEmailLocalPart(email);

  if (!emailLocalPart) {
    return "";
  }

  return emailLocalPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function suggestUsername(email?: string | null) {
  const emailLocalPart = getEmailLocalPart(email);

  if (!emailLocalPart) {
    return "";
  }

  return emailLocalPart
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function getEmailLocalPart(email?: string | null) {
  const [localPart] = email?.split("@") ?? [];

  return localPart?.trim() ?? "";
}
