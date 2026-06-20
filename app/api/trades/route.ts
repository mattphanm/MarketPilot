import { NextResponse } from "next/server";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { TradeSchema } from "@/lib/validations/trade";

/**
 * Read the current user's trade history.
 * Requires authentication, scopes the query by session userId, and returns trades
 * newest first by openedAt with createdAt as a stable secondary sort.
 */
export async function GET() {
  const user = await requireUser();

  if (!user.ok) {
    return unauthorizedResponse();
  }

  const trades = await prisma.trade.findMany({
    where: { userId: user.userId },
    orderBy: [{ openedAt: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ trades });
}

/**
 * Create a trade for the current user.
 * Requires authentication, validates the JSON body, normalizes date strings into
 * Date values, assigns ownership from the session, and returns the created trade.
 */
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

  const result = TradeSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid trade input", issues: result.error.issues },
      { status: 400 }
    );
  }

  const { openedAt, closedAt, ...tradeData } = result.data;
  const trade = await prisma.trade.create({
    data: {
      ...tradeData,
      openedAt: new Date(openedAt),
      ...(closedAt ? { closedAt: new Date(closedAt) } : {}),
      userId: user.userId,
    },
  });

  return NextResponse.json({ trade }, { status: 201 });
}
