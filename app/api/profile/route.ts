import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { serializeProfile } from "@/lib/profile/types";
import {
  ProfileInputSchema,
  buildUnavailableUsernameSuggestions,
  isReservedUsername,
} from "@/lib/validations/profile";

export async function PUT(request: Request) {
  const user = await requireUser();

  if (!user.ok) {
    return unauthorizedResponse();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const normalizedBody =
    body && typeof body === "object" && !Array.isArray(body)
      ? { ...body, username: normalizeSubmittedUsername(body) }
      : body;

  const result = ProfileInputSchema.safeParse(normalizedBody);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid profile input", issues: result.error.issues },
      { status: 400 }
    );
  }

  const usernameAvailability = await getUsernameAvailabilityIssue(
    result.data.username,
    user.userId
  );

  if (usernameAvailability) {
    return NextResponse.json(
      {
        error: "Invalid profile input",
        issues: [
          {
            path: ["username"],
            message: usernameAvailability.message,
            suggestions: usernameAvailability.suggestions,
          },
        ],
      },
      { status: 409 }
    );
  }

  try {
    const profile = await prisma.profile.upsert({
      where: { userId: user.userId },
      create: {
        ...result.data,
        userId: user.userId,
      },
      update: result.data,
      select: {
        displayName: true,
        username: true,
        bio: true,
      },
    });

    return NextResponse.json({ profile: serializeProfile(profile) });
  } catch (caught) {
    if (isUniqueUsernameError(caught)) {
      const suggestions = await getUnavailableUsernameSuggestions(
        result.data.username
      );

      return NextResponse.json(
        {
          error: "Invalid profile input",
          issues: [
            {
              path: ["username"],
              message: "That username is unavailable.",
              suggestions,
            },
          ],
        },
        { status: 409 }
      );
    }

    throw caught;
  }
}

function normalizeSubmittedUsername(body: object) {
  if (!("username" in body) || typeof body.username !== "string") {
    return undefined;
  }

  return body.username.trim().toLowerCase();
}

async function getUsernameAvailabilityIssue(username: string, userId: string) {
  const { unavailableUsernames, existingSubmittedUsername } =
    await getUnavailableUsernameSet(username);

  if (isReservedUsername(username)) {
    return {
      message: "That username is reserved.",
      suggestions: buildUnavailableUsernameSuggestions(
        username,
        unavailableUsernames
      ),
    };
  }

  if (
    existingSubmittedUsername &&
    existingSubmittedUsername.userId !== userId
  ) {
    return {
      message: "That username is unavailable.",
      suggestions: buildUnavailableUsernameSuggestions(
        username,
        unavailableUsernames
      ),
    };
  }

  return null;
}

async function getUnavailableUsernameSuggestions(username: string) {
  const { unavailableUsernames } = await getUnavailableUsernameSet(username);

  return buildUnavailableUsernameSuggestions(username, unavailableUsernames);
}

async function getUnavailableUsernameSet(username: string) {
  const candidateUsernames = Array.from(
    { length: 11 },
    (_, index) => `${username}_${index + 2}`
  );
  const usernamesToCheck = [username, ...candidateUsernames].filter(
    (candidate) => candidate.length <= 24
  );
  const profiles = await prisma.profile.findMany({
    where: {
      username: { in: usernamesToCheck },
    },
    select: {
      userId: true,
      username: true,
    },
  });
  const unavailableUsernames = new Set(
    profiles.map((profile) => profile.username)
  );
  const existingSubmittedUsername = profiles.find(
    (profile) => profile.username === username
  );

  return { unavailableUsernames, existingSubmittedUsername };
}

function isUniqueUsernameError(caught: unknown) {
  return (
    caught instanceof Prisma.PrismaClientKnownRequestError &&
    caught.code === "P2002" &&
    Array.isArray(caught.meta?.target) &&
    caught.meta.target.includes("username")
  );
}
