import { NextResponse } from "next/server";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { PlaybookSchema } from "@/lib/validations/playbook";

export async function GET() {
  const user = await requireUser();

  if (!user.ok) {
    return unauthorizedResponse();
  }

  const playbooks = await prisma.playbook.findMany({
    where: { userId: user.userId },
    orderBy: [{ createdAt: "asc" }],
  });

  return NextResponse.json({ playbooks });
}

export async function POST(request: Request) {
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

  const result = PlaybookSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid playbook input", issues: result.error.issues },
      { status: 400 }
    );
  }

  const playbook = await prisma.playbook.create({
    data: {
      ...result.data,
      userId: user.userId,
    },
  });

  return NextResponse.json({ playbook }, { status: 201 });
}
