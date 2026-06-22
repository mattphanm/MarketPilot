import { NextResponse } from "next/server";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { PlaybookUpdateSchema } from "@/lib/validations/playbook";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user.ok) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;
  const playbook = await prisma.playbook.findFirst({
    where: {
      id,
      userId: user.userId,
    },
  });

  if (!playbook) {
    return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
  }

  return NextResponse.json({ playbook });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user.ok) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = PlaybookUpdateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid playbook input", issues: result.error.issues },
      { status: 400 }
    );
  }

  const updateResult = await prisma.$transaction(async (tx) => {
    const { count } = await tx.playbook.updateMany({
      where: {
        id,
        userId: user.userId,
      },
      data: result.data,
    });

    if (count === 0) {
      return null;
    }

    return tx.playbook.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });
  });

  if (!updateResult) {
    return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
  }

  return NextResponse.json({ playbook: updateResult });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user.ok) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;
  const deleteResult = await prisma.$transaction(async (tx) => {
    const playbook = await tx.playbook.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!playbook) {
      return { status: "notFound" as const };
    }

    const referencedTrades = await tx.trade.count({
      where: {
        userId: user.userId,
        playbookId: id,
      },
    });

    if (referencedTrades > 0) {
      return { status: "referenced" as const, referencedTrades };
    }

    await tx.playbook.delete({
      where: { id },
    });

    return { status: "deleted" as const };
  });

  if (deleteResult.status === "notFound") {
    return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
  }

  if (deleteResult.status === "referenced") {
    return NextResponse.json(
      {
        error: "Playbook is still referenced by trades",
        issues: [
          {
            path: ["playbook"],
            message: `Remove ${deleteResult.referencedTrades} trade assignment before deleting this playbook.`,
          },
        ],
      },
      { status: 409 }
    );
  }

  return new Response(null, { status: 204 });
}
