export const ANALYTICS_RANGES = ["all", "30d", "90d", "ytd"] as const;

export type AnalyticsRangeKey = (typeof ANALYTICS_RANGES)[number];

export type AnalyticsTrade = {
  id?: string;
  symbol: string;
  side: "long" | "short" | string;
  riskDollars: number;
  rMultiple: number;
  openedAt: Date | string;
};

export type DailyAnalytics = {
  dateKey: string;
  trades: number;
  closedTrades: number;
  pnl: number;
  wins: number;
  losses: number;
  winRate: number | null;
  symbols: string[];
};

export type EquityPoint = {
  dateKey: string;
  pnl: number;
  cumulativePnl: number;
};

export type AnalyticsReport = {
  range: AnalyticsRangeKey;
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  winRate: number | null;
  profitFactor: number | null;
  averageRMultiple: number | null;
  averageWin: number;
  averageLoss: number;
  averageWinLoss: number | null;
  expectancy: number;
  bestTradePnl: number | null;
  worstTradePnl: number | null;
  activeDays: number;
  winningDays: number;
  losingDays: number;
  bestDayPnl: number | null;
  worstDayPnl: number | null;
  symbolsTraded: number;
  daily: DailyAnalytics[];
  equityCurve: EquityPoint[];
};

export type CalendarDay = DailyAnalytics & {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
};

export type CalendarWeekSummary = {
  pnl: number;
  trades: number;
  closedTrades: number;
  activeDays: number;
  winningDays: number;
  losingDays: number;
};

export type CalendarWeek = {
  days: CalendarDay[];
  summary: CalendarWeekSummary;
};

export type CalendarMonth = {
  monthStart: Date;
  monthLabel: string;
  weeks: CalendarWeek[];
};

type ReportOptions = {
  range?: AnalyticsRangeKey;
  start?: Date;
  end?: Date;
  now?: Date;
};

type DailyBucket = Omit<DailyAnalytics, "symbols"> & {
  symbols: Set<string>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function isAnalyticsRangeKey(value: string): value is AnalyticsRangeKey {
  return ANALYTICS_RANGES.includes(value as AnalyticsRangeKey);
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

export function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addUtcMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function addUtcDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function endOfUtcDay(date: Date) {
  return new Date(startOfUtcDay(date).getTime() + DAY_MS - 1);
}

export function formatUtcDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTradePnl(trade: AnalyticsTrade) {
  return trade.riskDollars * trade.rMultiple;
}

export function getTradeActivityDate(trade: AnalyticsTrade) {
  return toDate(trade.openedAt);
}

function getRangeBounds({ range = "all", start, end, now = new Date() }: ReportOptions) {
  if (start || end) {
    return {
      start: start ? startOfUtcDay(start) : null,
      end: end ? endOfUtcDay(end) : null,
    };
  }

  const today = startOfUtcDay(now);

  if (range === "30d") {
    return { start: addUtcDays(today, -29), end: endOfUtcDay(today) };
  }

  if (range === "90d") {
    return { start: addUtcDays(today, -89), end: endOfUtcDay(today) };
  }

  if (range === "ytd") {
    return {
      start: new Date(Date.UTC(today.getUTCFullYear(), 0, 1)),
      end: endOfUtcDay(today),
    };
  }

  return { start: null, end: null };
}

function isInsideBounds(date: Date, bounds: { start: Date | null; end: Date | null }) {
  const time = date.getTime();

  if (bounds.start && time < bounds.start.getTime()) {
    return false;
  }

  if (bounds.end && time > bounds.end.getTime()) {
    return false;
  }

  return true;
}

function createBucket(dateKey: string): DailyBucket {
  return {
    dateKey,
    trades: 0,
    closedTrades: 0,
    pnl: 0,
    wins: 0,
    losses: 0,
    winRate: null,
    symbols: new Set<string>(),
  };
}

function normalizeBucket(bucket: DailyBucket): DailyAnalytics {
  return {
    ...bucket,
    winRate: bucket.closedTrades > 0 ? bucket.wins / bucket.closedTrades : null,
    symbols: [...bucket.symbols].sort(),
  };
}

function aggregateDaily(trades: AnalyticsTrade[]) {
  const dailyMap = new Map<string, DailyBucket>();

  for (const trade of trades) {
    const dateKey = formatUtcDateKey(getTradeActivityDate(trade));
    const bucket = dailyMap.get(dateKey) ?? createBucket(dateKey);
    const pnl = getTradePnl(trade);

    bucket.trades += 1;
    bucket.symbols.add(trade.symbol);

    bucket.closedTrades += 1;
    bucket.pnl += pnl;

    if (pnl > 0) {
      bucket.wins += 1;
    } else if (pnl < 0) {
      bucket.losses += 1;
    }

    dailyMap.set(dateKey, bucket);
  }

  return [...dailyMap.values()]
    .map(normalizeBucket)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function createAnalyticsReport(
  trades: AnalyticsTrade[],
  options: ReportOptions = {}
): AnalyticsReport {
  const range = options.range ?? "all";
  const bounds = getRangeBounds(options);
  const filteredTrades = trades.filter((trade) =>
    isInsideBounds(getTradeActivityDate(trade), bounds)
  );
  const closedPnl = filteredTrades
    .map(getTradePnl);
  const grossProfit = closedPnl
    .filter((pnl) => pnl > 0)
    .reduce((total, pnl) => total + pnl, 0);
  const grossLoss = closedPnl
    .filter((pnl) => pnl < 0)
    .reduce((total, pnl) => total + pnl, 0);
  const netPnl = closedPnl.reduce((total, pnl) => total + pnl, 0);
  const winningTrades = closedPnl.filter((pnl) => pnl > 0).length;
  const losingTrades = closedPnl.filter((pnl) => pnl < 0).length;
  const breakevenTrades = closedPnl.filter((pnl) => pnl === 0).length;
  const totalRMultiple = filteredTrades.reduce(
    (total, trade) => total + trade.rMultiple,
    0
  );
  const daily = aggregateDaily(filteredTrades);
  let cumulativePnl = 0;
  const equityCurve = daily.map((day) => {
    cumulativePnl += day.pnl;

    return {
      dateKey: day.dateKey,
      pnl: day.pnl,
      cumulativePnl,
    };
  });
  const activeDays = daily.filter((day) => day.trades > 0).length;
  const winningDays = daily.filter((day) => day.pnl > 0).length;
  const losingDays = daily.filter((day) => day.pnl < 0).length;
  const dailyPnl = daily
    .filter((day) => day.closedTrades > 0)
    .map((day) => day.pnl);

  return {
    range,
    totalTrades: filteredTrades.length,
    closedTrades: closedPnl.length,
    openTrades: 0,
    winningTrades,
    losingTrades,
    breakevenTrades,
    netPnl,
    grossProfit,
    grossLoss,
    winRate: closedPnl.length > 0 ? winningTrades / closedPnl.length : null,
    profitFactor: grossLoss < 0 ? grossProfit / Math.abs(grossLoss) : null,
    averageRMultiple:
      filteredTrades.length > 0 ? totalRMultiple / filteredTrades.length : null,
    averageWin: winningTrades > 0 ? grossProfit / winningTrades : 0,
    averageLoss: losingTrades > 0 ? grossLoss / losingTrades : 0,
    averageWinLoss:
      winningTrades > 0 && losingTrades > 0
        ? grossProfit / winningTrades / Math.abs(grossLoss / losingTrades)
        : null,
    expectancy: closedPnl.length > 0 ? netPnl / closedPnl.length : 0,
    bestTradePnl: closedPnl.length > 0 ? Math.max(...closedPnl) : null,
    worstTradePnl: closedPnl.length > 0 ? Math.min(...closedPnl) : null,
    activeDays,
    winningDays,
    losingDays,
    bestDayPnl: dailyPnl.length > 0 ? Math.max(...dailyPnl) : null,
    worstDayPnl: dailyPnl.length > 0 ? Math.min(...dailyPnl) : null,
    symbolsTraded: new Set(filteredTrades.map((trade) => trade.symbol)).size,
    daily,
    equityCurve,
  };
}

export function buildCalendarMonth(
  trades: AnalyticsTrade[],
  monthDate: Date
): CalendarMonth {
  const monthStart = startOfUtcMonth(monthDate);
  const gridStart = addUtcDays(monthStart, -monthStart.getUTCDay());
  const dailyByKey = new Map(aggregateDaily(trades).map((day) => [day.dateKey, day]));
  const weeks: CalendarWeek[] = [];

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const days: CalendarDay[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = addUtcDays(gridStart, weekIndex * 7 + dayIndex);
      const dateKey = formatUtcDateKey(date);
      const stats =
        dailyByKey.get(dateKey) ??
        ({
          dateKey,
          trades: 0,
          closedTrades: 0,
          pnl: 0,
          wins: 0,
          losses: 0,
          winRate: null,
          symbols: [],
        } satisfies DailyAnalytics);

      days.push({
        ...stats,
        date,
        dayNumber: date.getUTCDate(),
        isCurrentMonth: date.getUTCMonth() === monthStart.getUTCMonth(),
      });
    }

    const summaryDays = days.filter(
      (day) => day.isCurrentMonth && day.trades > 0
    );

    weeks.push({
      days,
      summary: {
        pnl: summaryDays.reduce((total, day) => total + day.pnl, 0),
        trades: summaryDays.reduce((total, day) => total + day.trades, 0),
        closedTrades: summaryDays.reduce(
          (total, day) => total + day.closedTrades,
          0
        ),
        activeDays: summaryDays.length,
        winningDays: summaryDays.filter((day) => day.pnl > 0).length,
        losingDays: summaryDays.filter((day) => day.pnl < 0).length,
      },
    });
  }

  return {
    monthStart,
    monthLabel: monthFormatter.format(monthStart),
    weeks,
  };
}

export function getLatestTradeMonth(trades: AnalyticsTrade[], fallback = new Date()) {
  if (trades.length === 0) {
    return startOfUtcMonth(fallback);
  }

  const latestTrade = [...trades].sort(
    (a, b) =>
      getTradeActivityDate(b).getTime() - getTradeActivityDate(a).getTime()
  )[0];

  return startOfUtcMonth(getTradeActivityDate(latestTrade));
}
