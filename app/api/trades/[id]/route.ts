import { NextResponse } from "next/server";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { TradeUpdateSchema } from "@/lib/validations/trade";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Read one trade by id for the current user.
 * Requires authentication and looks up by both id and session userId so users
 * cannot access another user's trade; returns 404 when no owned trade exists.
 */
export async function GET(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user.ok) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;
  const trade = await prisma.trade.findFirst({
    where: {
      id,
      userId: user.userId,
    },
  });

  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  return NextResponse.json({ trade });
}

/**
 * Update one trade by id for the current user.
 * Requires authentication, accepts partial validated fields, verifies ownership
 * inside a transaction, checks the final date range, and returns the refreshed trade.
 */
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

  const result = TradeUpdateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid trade input", issues: result.error.issues },
      { status: 400 }
    );
  }

  const { openedAt, closedAt, ...tradeData } = result.data;
  const updateResult = await prisma.$transaction(async (tx) => {
    const existingTrade = await tx.trade.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!existingTrade) {
      return { status: "notFound" as const };
    }

    const nextOpenedAt = openedAt ? new Date(openedAt) : existingTrade.openedAt;
    const nextClosedAt = closedAt ? new Date(closedAt) : existingTrade.closedAt;

    if (nextClosedAt && nextClosedAt < nextOpenedAt) {
      return { status: "invalidDateRange" as const };
    }

    const { count } = await tx.trade.updateMany({
      where: {
        id,
        userId: user.userId,
      },
      data: {
        ...tradeData,
        ...(openedAt ? { openedAt: new Date(openedAt) } : {}),
        ...(closedAt ? { closedAt: new Date(closedAt) } : {}),
      },
    });

    if (count === 0) {
      return { status: "notFound" as const };
    }

    const trade = await tx.trade.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    return trade
      ? { status: "updated" as const, trade }
      : { status: "notFound" as const };
  });

  if (updateResult.status === "notFound") {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  if (updateResult.status === "invalidDateRange") {
    return NextResponse.json(
      {
        error: "Invalid trade input",
        issues: [{ path: ["closedAt"], message: "closedAt must be after openedAt" }],
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ trade: updateResult.trade });
}

/**
 * Delete one trade by id for the current user.
 * Requires authentication and deletes with both id and session userId; returns
 * 404 when no owned trade matches and 204 with no body after a successful delete.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user.ok) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;
  const { count } = await prisma.trade.deleteMany({
    where: {
      id,
      userId: user.userId,
    },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
