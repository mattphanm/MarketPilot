import { NextResponse } from "next/server";
import {
  createAnalyticsReport,
  isAnalyticsRangeKey,
  type AnalyticsRangeKey,
} from "@/lib/analytics/report";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";

function parseDateFilter(value: string | null, name: string) {
  if (!value) {
    return { ok: true as const, date: undefined };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: `${name} must use YYYY-MM-DD format.` },
        { status: 400 }
      ),
    };
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: `${name} must be a valid date.` },
        { status: 400 }
      ),
    };
  }

  return { ok: true as const, date };
}

export async function GET(request: Request) {
  const user = await requireUser();

  if (!user.ok) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get("range") ?? "all";

  if (!isAnalyticsRangeKey(rangeParam)) {
    return NextResponse.json(
      { error: "range must be one of all, 30d, 90d, or ytd." },
      { status: 400 }
    );
  }

  const start = parseDateFilter(url.searchParams.get("start"), "start");
  const end = parseDateFilter(url.searchParams.get("end"), "end");

  if (!start.ok) {
    return start.response;
  }

  if (!end.ok) {
    return end.response;
  }

  if (start.date && end.date && end.date < start.date) {
    return NextResponse.json(
      { error: "end must be on or after start." },
      { status: 400 }
    );
  }

  const trades = await prisma.trade.findMany({
    where: { userId: user.userId },
    select: {
      id: true,
      symbol: true,
      side: true,
      riskDollars: true,
      rMultiple: true,
      openedAt: true,
    },
  });
  const report = createAnalyticsReport(trades, {
    range: rangeParam as AnalyticsRangeKey,
    start: start.date,
    end: end.date,
  });

  return NextResponse.json({ report });
}
