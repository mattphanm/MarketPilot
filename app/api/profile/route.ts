import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { serializeProfile } from "@/lib/profile/types";
import { ProfileSchema } from "@/lib/validations/profile";

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

  const result = ProfileSchema.safeParse(normalizedBody);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid profile input", issues: result.error.issues },
      { status: 400 }
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
      return NextResponse.json(
        {
          error: "Invalid profile input",
          issues: [
            {
              path: ["username"],
              message: "This username is already taken.",
            },
          ],
        },
        { status: 400 }
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

function isUniqueUsernameError(caught: unknown) {
  return (
    caught instanceof Prisma.PrismaClientKnownRequestError &&
    caught.code === "P2002" &&
    Array.isArray(caught.meta?.target) &&
    caught.meta.target.includes("username")
  );
}
