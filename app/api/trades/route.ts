import { NextResponse } from "next/server";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { TradeSchema } from "@/lib/validations/trade";

export async function GET() {
  const user = await requireUser();

  if (!user.ok) {
    return unauthorizedResponse();
  }

  return NextResponse.json({ userId: user.userId });
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

  const result = TradeSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid trade input", issues: result.error.issues },
      { status: 400 }
    );
  }

  const trade = await prisma.trade.create({
    data: {
      ...result.data,
      openedAt: new Date(result.data.openedAt),
      closedAt: result.data.closedAt ? new Date(result.data.closedAt) : undefined,
      userId: user.userId,
    },
  });

  return NextResponse.json({ trade }, { status: 201 });
}
