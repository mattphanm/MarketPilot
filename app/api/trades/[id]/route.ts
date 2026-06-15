import { NextResponse } from "next/server";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { TradeUpdateSchema } from "@/lib/validations/trade";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  const existingTrade = await prisma.trade.findFirst({
    where: {
      id,
      userId: user.userId,
    },
  });

  if (!existingTrade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  const trade = await prisma.trade.update({
    where: { id },
    data: {
      ...result.data,
      openedAt: result.data.openedAt ? new Date(result.data.openedAt) : undefined,
      closedAt: result.data.closedAt ? new Date(result.data.closedAt) : undefined,
    },
  });

  return NextResponse.json({ trade });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return NextResponse.json(
    { error: "Not implemented", route: `DELETE /api/trades/${id}` },
    { status: 501 }
  );
}
