import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = ProfileSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid profile input", issues: result.error.issues },
      { status: 400 }
    );
  }

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
}
