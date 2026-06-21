"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  BarChart2,
  Bell,
  BookMarked,
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  List,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { signOutUser } from "@/app/actions/auth";
import {
  formatTradeDateInput,
  parseTradeDateInput,
} from "@/lib/trades/date-input";
import {
  addUtcMonths,
  buildCalendarMonth,
  createAnalyticsReport,
  getTradePnl,
  startOfUtcMonth,
  type AnalyticsRangeKey,
  type AnalyticsReport,
  type EquityPoint,
} from "@/lib/analytics/report";
import type { TradeDto, TradePayload, TradeSide } from "@/lib/trades/types";

type TradeJournalProps = {
  initialTrades: TradeDto[];
  userName?: string | null;
  userEmail?: string | null;
  nowIso: string;
};

type DashboardView =
  | "dashboard"
  | "trades"
  | "journal"
  | "playbooks"
  | "analytics"
  | "settings";

type TradeFormState = {
  symbol: string;
  side: TradeSide;
  quantity: string;
  entry: string;
  exit: string;
  openedAt: string;
  closedAt: string;
  notes: string;
};

type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
};

type ApiTradeBody = {
  trade?: TradeDto;
  error?: string;
  issues?: ApiIssue[];
};

type MoneyTone = "neutral" | "profit" | "loss";

type WatchlistItem = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  targetEntry: number;
  stop: number;
  target: number;
  confidence: number;
  alertState: "Triggered" | "Near Entry" | "Watching";
  thesis: string;
  catalyst: string;
  tags: string[];
  trade: TradeDto;
};

type PlaybookSummary = {
  id: string;
  name: string;
  description: string;
  rules: string[];
  winRate: number | null;
  avgReturn: number;
  avgRMultiple: number;
  totalTrades: number;
  avgHoldDays: number;
  bestTrade: string;
  worstTrade: string;
  trades: TradeDto[];
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const ratioFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const navItems: Array<{ id: DashboardView; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "trades", label: "Trade Log", icon: List },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "playbooks", label: "Playbooks", icon: BookMarked },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
];

const viewMeta: Record<DashboardView, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Completed futures trade overview",
  },
  trades: {
    title: "Trade Log",
    subtitle: "Completed trade history and journal context",
  },
  journal: {
    title: "Journal",
    subtitle: "Trade ideas and post-trade review",
  },
  playbooks: {
    title: "Playbooks",
    subtitle: "Repeatable setups derived from your history",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Performance, behavior, and consistency metrics",
  },
  settings: {
    title: "Settings",
    subtitle: "Account and workspace details",
  },
};

const rangeOptions: Array<{ key: AnalyticsRangeKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "ytd", label: "YTD" },
];

const allocationColors = ["#6C5DD3", "#16A779", "#3B82F6", "#D99A20", "#E25555"];

function createEmptyForm(nowIso: string): TradeFormState {
  return {
    symbol: "",
    side: "buy",
    quantity: "",
    entry: "",
    exit: "",
    openedAt: formatTradeDateInput(nowIso),
    closedAt: "",
    notes: "",
  };
}

function tradeToForm(trade: TradeDto): TradeFormState {
  return {
    symbol: trade.symbol,
    side: trade.side,
    quantity: String(trade.quantity),
    entry: String(trade.entry),
    exit: trade.exit === null ? "" : String(trade.exit),
    openedAt: formatTradeDateInput(trade.openedAt),
    closedAt: formatTradeDateInput(trade.closedAt),
    notes: trade.notes ?? "",
  };
}

function normalizeTrade(trade: TradeDto): TradeDto {
  return {
    ...trade,
    openedAt: new Date(trade.openedAt).toISOString(),
    closedAt: trade.closedAt ? new Date(trade.closedAt).toISOString() : null,
    createdAt: new Date(trade.createdAt).toISOString(),
    updatedAt: new Date(trade.updatedAt).toISOString(),
  };
}

function sortTrades(trades: TradeDto[]) {
  return [...trades].sort((a, b) => {
    const openedDiff =
      new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();

    if (openedDiff !== 0) {
      return openedDiff;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatCompactMoney(value: number) {
  const sign = value < 0 ? "-" : "";
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    return `${sign}$${formatCompactUnit(absoluteValue / 1_000_000)}M`;
  }

  if (absoluteValue >= 1_000) {
    return `${sign}$${formatCompactUnit(absoluteValue / 1_000)}K`;
  }

  return `${sign}${moneyFormatter.format(absoluteValue)}`;
}

function formatCompactUnit(value: number) {
  const fixedValue = value >= 10 ? value.toFixed(0) : value.toFixed(1);

  return fixedValue.replace(/\.0$/, "");
}

function formatOptionalMoney(value: number | null) {
  return value === null ? "-" : formatMoney(value);
}

function formatPercent(value: number | null) {
  return value === null ? "-" : percentFormatter.format(value);
}

function formatRatio(value: number | null) {
  return value === null ? "-" : ratioFormatter.format(value);
}

function formatDate(iso: string | null) {
  if (!iso) {
    return "Open";
  }

  return `${dateFormatter.format(new Date(iso))} UTC`;
}

function formatShortDate(iso: string | null) {
  if (!iso) {
    return "Open";
  }

  return shortDateFormatter.format(new Date(iso));
}

function getInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "MP";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getMoneyTone(value: number | null): MoneyTone {
  if (value === null || value === 0) {
    return "neutral";
  }

  return value > 0 ? "profit" : "loss";
}

function getMetricValueClass(tone: MoneyTone) {
  if (tone === "profit") {
    return "text-[#16A779]";
  }

  if (tone === "loss") {
    return "text-[#E25555]";
  }

  return "text-[#171923]";
}

function getStatusBadgeClass(trade: TradeDto) {
  const pnl = getTradePnl(trade);

  if (pnl === null) {
    return "bg-blue-50 text-blue-700";
  }

  if (pnl > 0) {
    return "bg-emerald-50 text-[#16A779]";
  }

  if (pnl < 0) {
    return "bg-red-50 text-[#E25555]";
  }

  return "bg-amber-50 text-[#D99A20]";
}

function getTradeStatusLabel(trade: TradeDto) {
  const pnl = getTradePnl(trade);

  if (pnl === null) {
    return "OPEN";
  }

  if (pnl > 0) {
    return "WIN";
  }

  if (pnl < 0) {
    return "LOSS";
  }

  return "FLAT";
}

function getDirectionLabel(side: TradeSide) {
  return side === "buy" ? "Long" : "Short";
}

function getTradeNotional(trade: TradeDto) {
  return trade.entry * trade.quantity;
}

function getTradeReturnPct(trade: TradeDto) {
  if (trade.exit === null) {
    return null;
  }

  const direction = trade.side === "buy" ? 1 : -1;
  return ((trade.exit - trade.entry) / trade.entry) * direction;
}

function getOpenTradeAgeDays(trade: TradeDto, now: Date) {
  const openedAt = new Date(trade.openedAt);
  const elapsed = now.getTime() - openedAt.getTime();

  return Math.max(0, Math.floor(elapsed / (24 * 60 * 60 * 1000)));
}

function getTradeHoldDays(trade: TradeDto, now: Date) {
  const openedAt = new Date(trade.openedAt).getTime();
  const endedAt = trade.closedAt ? new Date(trade.closedAt).getTime() : now.getTime();

  return Math.max(0, Math.ceil((endedAt - openedAt) / (24 * 60 * 60 * 1000)));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function buildScoreMetrics(report: AnalyticsReport) {
  const winRateScore = clampScore((report.winRate ?? 0) * 100);
  const profitFactorScore = clampScore(((report.profitFactor ?? 0) / 2) * 100);
  const payoffScore = clampScore(((report.averageWinLoss ?? 0) / 2) * 100);
  const expectancyBase = Math.max(
    Math.abs(report.averageWin),
    Math.abs(report.averageLoss),
    1
  );
  const expectancyScore = clampScore(
    report.expectancy > 0 ? (report.expectancy / expectancyBase) * 100 : 0
  );
  const consistencyScore = clampScore(
    report.activeDays > 0 ? (report.winningDays / report.activeDays) * 100 : 0
  );
  const metrics = [
    { label: "Win rate", value: winRateScore },
    { label: "Profit factor", value: profitFactorScore },
    { label: "Payoff", value: payoffScore },
    { label: "Expectancy", value: expectancyScore },
    { label: "Consistency", value: consistencyScore },
  ];

  return {
    score:
      metrics.reduce((total, metric) => total + metric.value, 0) /
      metrics.length,
    metrics,
  };
}

function getRadarPoints(metrics: Array<{ value: number }>) {
  return metrics
    .map((metric, index) => {
      const angle = -Math.PI / 2 + (index / metrics.length) * Math.PI * 2;
      const radius = (clampScore(metric.value) / 100) * 42;

      return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
    })
    .join(" ");
}

function getEquityChart(points: EquityPoint[]) {
  const width = 640;
  const height = 220;
  const padding = 18;

  if (points.length === 0) {
    return { width, height, linePoints: "", zeroY: height / 2 };
  }

  const values = points.map((point) => point.cumulativePnl);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const xStep =
    points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const yFor = (value: number) =>
    height - padding - ((value - min) / span) * (height - padding * 2);
  const linePoints = points
    .map(
      (point, index) =>
        `${padding + index * xStep},${yFor(point.cumulativePnl)}`
    )
    .join(" ");

  return { width, height, linePoints, zeroY: yFor(0) };
}

function buildSymbolAllocation(trades: TradeDto[]) {
  const openTrades = trades.filter((trade) => trade.exit === null);
  const source = openTrades.length > 0 ? openTrades : trades;
  const totals = new Map<string, number>();

  for (const trade of source) {
    totals.set(trade.symbol, (totals.get(trade.symbol) ?? 0) + getTradeNotional(trade));
  }

  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([symbol, value], index) => ({
      symbol,
      value,
      percent: total > 0 ? value / total : 0,
      color: allocationColors[index % allocationColors.length],
    }));
}

function buildMonthlyReturns(trades: TradeDto[]) {
  const monthly = new Map<string, { label: string; pnl: number; notional: number }>();

  for (const trade of trades) {
    const pnl = getTradePnl(trade);

    if (pnl === null) {
      continue;
    }

    const date = new Date(trade.closedAt ?? trade.openedAt);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth()).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("en-US", {
      month: "short",
      timeZone: "UTC",
    }).format(date);
    const current = monthly.get(key) ?? { label, pnl: 0, notional: 0 };
    current.pnl += pnl;
    current.notional += getTradeNotional(trade);
    monthly.set(key, current);
  }

  return [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, month]) => ({
      month: month.label,
      returnPct: month.notional > 0 ? (month.pnl / month.notional) * 100 : 0,
      pnl: month.pnl,
    }));
}

function buildReturnDistribution(trades: TradeDto[]) {
  const buckets = [
    { range: "< -10%", count: 0 },
    { range: "-10% to -5%", count: 0 },
    { range: "-5% to 0%", count: 0 },
    { range: "0% to 5%", count: 0 },
    { range: "5% to 10%", count: 0 },
    { range: "> 10%", count: 0 },
  ];

  for (const trade of trades) {
    const returnPct = getTradeReturnPct(trade);

    if (returnPct === null) {
      continue;
    }

    const value = returnPct * 100;

    if (value < -10) {
      buckets[0].count += 1;
    } else if (value < -5) {
      buckets[1].count += 1;
    } else if (value < 0) {
      buckets[2].count += 1;
    } else if (value < 5) {
      buckets[3].count += 1;
    } else if (value < 10) {
      buckets[4].count += 1;
    } else {
      buckets[5].count += 1;
    }
  }

  return buckets;
}

function buildWatchlistItems(trades: TradeDto[], now: Date): WatchlistItem[] {
  const openTrades = trades.filter((trade) => trade.exit === null);
  const source = (openTrades.length > 0 ? openTrades : trades).slice(0, 8);

  return source.map((trade) => {
    const isLong = trade.side === "buy";
    const price = trade.exit ?? trade.entry;
    const targetEntry = trade.entry;
    const stop = trade.entry * (isLong ? 0.95 : 1.05);
    const target = trade.entry * (isLong ? 1.12 : 0.88);
    const ageDays = getTradeHoldDays(trade, now);
    const hasNotes = Boolean(trade.notes?.trim());
    const confidence = clampScore(
      58 + (hasNotes ? 16 : 0) + Math.max(0, 18 - ageDays)
    );
    const distanceFromEntry = Math.abs(price - targetEntry) / targetEntry;
    const alertState =
      trade.exit === null
        ? "Triggered"
        : distanceFromEntry <= 0.025
          ? "Near Entry"
          : "Watching";

    return {
      id: trade.id,
      symbol: trade.symbol,
      name: `${getDirectionLabel(trade.side)} ${trade.quantity} shares`,
      price,
      targetEntry,
      stop,
      target,
      confidence,
      alertState,
      thesis:
        trade.notes || "No thesis note has been captured for this trade yet.",
      catalyst: formatShortDate(trade.closedAt ?? trade.openedAt),
      tags: [
        getDirectionLabel(trade.side),
        trade.exit === null ? "Open" : "Closed",
      ],
      trade,
    };
  });
}

function buildPlaybooks(trades: TradeDto[], now: Date): PlaybookSummary[] {
  const candidates: Array<{
    id: string;
    name: string;
    description: string;
    rules: string[];
    trades: TradeDto[];
  }> = [
    {
      id: "long",
      name: "Long Bias",
      description: "Trades opened from the buy side with thesis notes and managed exits.",
      rules: [
        "Entry has a written thesis",
        "Exit price is captured for review",
        "Position size is visible before entry",
      ],
      trades: trades.filter((trade) => trade.side === "buy"),
    },
    {
      id: "short",
      name: "Short / Hedge",
      description: "Sell-side trades used for downside exposure or tactical hedging.",
      rules: [
        "Risk is capped before entry",
        "Target is defined before the trade is closed",
        "Review happens within the same week",
      ],
      trades: trades.filter((trade) => trade.side === "sell"),
    },
    {
      id: "open-review",
      name: "Open Trade Review",
      description: "Active positions that still need exit decisions and updated notes.",
      rules: [
        "Review open trades daily",
        "Update notes when thesis changes",
        "Close the loop with an exit and post-mortem",
      ],
      trades: trades.filter((trade) => trade.exit === null),
    },
  ];

  return candidates
    .filter((candidate) => candidate.trades.length > 0)
    .map((candidate) => {
      const closed = candidate.trades.filter((trade) => trade.exit !== null);
      const wins = closed.filter((trade) => (getTradePnl(trade) ?? 0) > 0);
      const returns = closed
        .map(getTradeReturnPct)
        .filter((returnPct): returnPct is number => returnPct !== null);
      const sorted = [...closed].sort(
        (a, b) => (getTradePnl(b) ?? 0) - (getTradePnl(a) ?? 0)
      );
      const averageReturn =
        returns.length > 0
          ? (returns.reduce((total, value) => total + value, 0) / returns.length) * 100
          : 0;
      const averageHoldDays =
        candidate.trades.reduce(
          (total, trade) => total + getTradeHoldDays(trade, now),
          0
        ) / candidate.trades.length;

      return {
        ...candidate,
        winRate: closed.length > 0 ? wins.length / closed.length : null,
        avgReturn: averageReturn,
        avgRMultiple: averageReturn / 5,
        totalTrades: candidate.trades.length,
        avgHoldDays: averageHoldDays,
        bestTrade: sorted[0]
          ? `${sorted[0].symbol} ${formatMoney(getTradePnl(sorted[0]) ?? 0)}`
          : "Open",
        worstTrade: sorted[sorted.length - 1]
          ? `${sorted[sorted.length - 1].symbol} ${formatMoney(
              getTradePnl(sorted[sorted.length - 1]) ?? 0
            )}`
          : "Open",
      };
    });
}

function formatIssue(issue: ApiIssue) {
  const field =
    issue.path && issue.path.length > 0 ? issue.path.join(".") : "input";

  return issue.message ? `${field}: ${issue.message}` : "";
}

function formatApiError(body: ApiTradeBody | null, fallback: string) {
  const issueText = body?.issues?.map(formatIssue).filter(Boolean).join("; ");

  if (body?.error && issueText) {
    return `${body.error}: ${issueText}`;
  }

  return body?.error ?? issueText ?? fallback;
}

async function readApiBody(response: Response) {
  try {
    return (await response.json()) as ApiTradeBody;
  } catch {
    return null;
  }
}

function buildPayload(
  form: TradeFormState,
  editingTrade: TradeDto | null
): { payload: TradePayload; error: null } | { payload: null; error: string } {
  const symbol = form.symbol.trim().toUpperCase();
  const entry = Number(form.entry);
  const quantity = Number(form.quantity);
  const openedAtResult = parseTradeDateInput(form.openedAt);
  const exitValue = form.exit.trim();
  const closedAtValue = form.closedAt.trim();
  const notes = form.notes.trim();

  if (!symbol) {
    return { payload: null, error: "Symbol is required." };
  }

  if (!Number.isFinite(entry) || entry <= 0) {
    return { payload: null, error: "Entry must be a positive number." };
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { payload: null, error: "Quantity must be a positive whole number." };
  }

  if (!openedAtResult.ok) {
    return { payload: null, error: `Opened date: ${openedAtResult.error}` };
  }

  if (editingTrade && editingTrade.exit !== null && exitValue === "") {
    return {
      payload: null,
      error: "Enter an exit price before saving this edit.",
    };
  }

  if (editingTrade && editingTrade.closedAt !== null && closedAtValue === "") {
    return {
      payload: null,
      error: "Enter a closed date before saving this edit.",
    };
  }

  const payload: TradePayload = {
    symbol,
    side: form.side,
    entry,
    quantity,
    openedAt: openedAtResult.iso,
  };

  if (exitValue) {
    const exit = Number(exitValue);

    if (!Number.isFinite(exit) || exit <= 0) {
      return { payload: null, error: "Exit must be a positive number." };
    }

    payload.exit = exit;
  }

  if (closedAtValue) {
    const closedAtResult = parseTradeDateInput(closedAtValue);

    if (!closedAtResult.ok) {
      return { payload: null, error: `Closed date: ${closedAtResult.error}` };
    }

    if (new Date(closedAtResult.iso) < new Date(openedAtResult.iso)) {
      return {
        payload: null,
        error: "Closed date must be after the opened date.",
      };
    }

    payload.closedAt = closedAtResult.iso;
  }

  if (notes || editingTrade?.notes) {
    payload.notes = notes;
  }

  return { payload, error: null };
}

function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "profit" | "loss";
}) {
  return (
    <div className="rounded-lg border border-[#E6E8EF] bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]">
      <p className="text-[11px] font-medium text-[#697386]">{label}</p>
      <p
        className={`mt-2 truncate text-[22px] font-bold leading-none ${getMetricValueClass(
          tone
        )}`}
      >
        {value}
      </p>
      <p className="mt-2 min-h-5 truncate text-[11px] text-[#697386]">
        {detail}
      </p>
    </div>
  );
}

function StatusPill({ trade }: { trade: TradeDto }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-semibold ${getStatusBadgeClass(
        trade
      )}`}
    >
      {getTradeStatusLabel(trade)}
    </span>
  );
}

function DirectionPill({ side }: { side: TradeSide }) {
  const isLong = side === "buy";

  return (
    <span
      className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-medium ${
        isLong ? "bg-emerald-50 text-[#16A779]" : "bg-red-50 text-[#E25555]"
      }`}
    >
      {getDirectionLabel(side)}
    </span>
  );
}

function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-[#D8DCE7] bg-white px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-[#171923]">{title}</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-[#697386]">{body}</p>
      </div>
    </div>
  );
}

function AppCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#E6E8EF] bg-white p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[13px] font-semibold text-[#171923]">
      {children}
    </h2>
  );
}

function MiniBarChart({
  data,
  valueKey,
  labelKey,
  positiveColor = "#16A779",
  negativeColor = "#E25555",
}: {
  data: Array<Record<string, string | number>>;
  valueKey: string;
  labelKey: string;
  positiveColor?: string;
  negativeColor?: string;
}) {
  const maxAbs = Math.max(
    1,
    ...data.map((item) => Math.abs(Number(item[valueKey]) || 0))
  );

  return (
    <div className="flex h-36 items-end gap-2 border-b border-[#E6E8EF] pb-2">
      {data.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const height = Math.max(8, (Math.abs(value) / maxAbs) * 100);

        return (
          <div
            key={String(item[labelKey])}
            className="flex min-w-8 flex-1 flex-col items-center justify-end gap-1"
            title={`${item[labelKey]}: ${value}`}
          >
            <div
              className="w-full rounded-t-sm"
              style={{
                height: `${height}%`,
                background: value >= 0 ? positiveColor : negativeColor,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function Sidebar({
  activeView,
  userName,
  userEmail,
  onAddTrade,
  onNav,
}: {
  activeView: DashboardView;
  userName: string;
  userEmail?: string | null;
  onAddTrade: () => void;
  onNav: (view: DashboardView) => void;
}) {
  return (
    <aside className="hidden min-h-screen w-[220px] shrink-0 flex-col border-r border-white/10 bg-[#1E1B2E] lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C5DD3]">
          <TrendingUp size={15} color="#fff" aria-hidden="true" />
        </div>
        <span className="text-[15px] font-bold tracking-normal text-white">
          MarketPilot
        </span>
      </div>

      <div className="mx-3 mb-4 rounded-lg bg-white/5 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6C5DD3] text-[10px] font-bold text-white">
              {getInitials(userName).slice(0, 1)}
            </div>
            <p className="truncate text-[12px] font-medium text-white">
              Futures Journal
            </p>
          </div>
          <ChevronDown size={13} color="#A8A5C1" aria-hidden="true" />
        </div>
      </div>

      <div className="px-3 pb-5">
        <button
          type="button"
          onClick={onAddTrade}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white transition hover:bg-[#5B4BC7] focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <Plus size={13} aria-hidden="true" />
          Add Trade
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {navItems.map((item) => {
          const selected = item.id === activeView;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNav(item.id)}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg border-l-2 px-3 text-left text-[13px] transition ${
                selected
                  ? "border-[#6C5DD3] bg-[#6C5DD3]/20 font-medium text-white"
                  : "border-transparent text-[#A8A5C1] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon
                size={15}
                color={selected ? "#6C5DD3" : "#A8A5C1"}
                aria-hidden="true"
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6C5DD3] text-[11px] font-bold text-white">
            {getInitials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-white">{userName}</p>
            <p className="truncate text-[11px] text-[#A8A5C1]">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileNav({
  activeView,
  onNav,
}: {
  activeView: DashboardView;
  onNav: (view: DashboardView) => void;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-[#E6E8EF] bg-white px-4 py-2 lg:hidden">
      {navItems.map((item) => {
        const selected = activeView === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNav(item.id)}
            className={`h-8 shrink-0 rounded-md border px-3 text-[12px] font-medium ${
              selected
                ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                : "border-[#E6E8EF] bg-white text-[#697386]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({
  title,
  subtitle,
  userName,
  analyticsRange,
  onRangeChange,
}: {
  title: string;
  subtitle: string;
  userName: string;
  analyticsRange: AnalyticsRangeKey;
  onRangeChange: (range: AnalyticsRangeKey) => void;
}) {
  return (
    <header className="flex min-h-[54px] shrink-0 flex-col gap-3 border-b border-[#E6E8EF] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-5">
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-semibold leading-tight text-[#171923]">
          {title}
        </h1>
        <p className="mt-0.5 truncate text-[11px] text-[#697386]">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="hidden h-8 items-center gap-1.5 rounded-lg border border-[#E6E8EF] bg-white px-3 text-[12px] text-[#697386] transition hover:bg-[#F7F8FA] md:flex"
        >
          <span>Current range</span>
          <ChevronDown size={12} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="hidden h-8 items-center gap-1.5 rounded-lg border border-[#E6E8EF] bg-white px-3 text-[12px] text-[#697386] transition hover:bg-[#F7F8FA] md:flex"
        >
          <Search size={13} aria-hidden="true" />
          <span>Search</span>
          <span className="rounded bg-[#F7F8FA] px-1 py-0.5 text-[10px] text-[#697386]">
            Cmd K
          </span>
        </button>

        <button
          type="button"
          className="hidden h-8 items-center gap-1.5 rounded-lg border border-[#E6E8EF] bg-white px-3 text-[12px] text-[#697386] transition hover:bg-[#F7F8FA] md:flex"
        >
          <RefreshCw size={13} aria-hidden="true" />
          <span>Sync</span>
        </button>

        <div className="flex rounded-lg border border-[#E6E8EF] bg-[#F7F8FA] p-0.5">
          {rangeOptions.map((option) => {
            const selected = analyticsRange === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onRangeChange(option.key)}
                className={`h-7 min-w-10 rounded-md px-2 text-[11px] font-semibold transition ${
                  selected
                    ? "bg-white text-[#6C5DD3] shadow-sm"
                    : "text-[#697386] hover:text-[#171923]"
                }`}
                aria-pressed={selected}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <form action={signOutUser}>
          <button
            type="submit"
            className="h-8 rounded-md border border-[#E6E8EF] bg-white px-3 text-[12px] font-medium text-[#697386] transition hover:bg-[#F7F8FA] focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
          >
            Sign out
          </button>
        </form>

        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6E8EF] bg-white transition hover:bg-[#F7F8FA]"
          aria-label="Notifications"
        >
          <Bell size={14} color="#697386" aria-hidden="true" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#6C5DD3]" />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6C5DD3] text-[11px] font-bold text-white">
          {getInitials(userName)}
        </div>
      </div>
    </header>
  );
}

function EquityChart({
  report,
  chart,
}: {
  report: AnalyticsReport;
  chart: ReturnType<typeof getEquityChart>;
}) {
  return (
    <div className="h-[220px] overflow-hidden rounded-lg border border-[#EEF0F5] bg-[#F7F8FA]">
      {report.equityCurve.length === 0 ? (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[#697386]">
          No closed trades in this period.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="h-full w-full"
          role="img"
          aria-label="Daily cumulative P&L chart"
        >
          {[0.25, 0.5, 0.75].map((offset) => (
            <line
              key={offset}
              x1="0"
              x2={chart.width}
              y1={chart.height * offset}
              y2={chart.height * offset}
              stroke="#E6E8EF"
              strokeWidth="1"
            />
          ))}
          <line
            x1="0"
            x2={chart.width}
            y1={chart.zeroY}
            y2={chart.zeroY}
            stroke="#CBD5E1"
            strokeWidth="1"
          />
          <polyline
            points={chart.linePoints}
            fill="none"
            stroke={report.netPnl >= 0 ? "#6C5DD3" : "#E25555"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        </svg>
      )}
    </div>
  );
}

function DashboardOverview({
  trades,
  report,
  score,
  equityChart,
  onNav,
  currentDate,
}: {
  trades: TradeDto[];
  report: AnalyticsReport;
  score: ReturnType<typeof buildScoreMetrics>;
  equityChart: ReturnType<typeof getEquityChart>;
  onNav: (view: DashboardView) => void;
  currentDate: Date;
}) {
  const openTrades = trades.filter((trade) => trade.exit === null);
  const recentTrades = trades.slice(0, 8);
  const allocation = buildSymbolAllocation(trades);
  const loggedCapital = trades.reduce((sum, trade) => sum + getTradeNotional(trade), 0);
  const dailyBars = report.daily.filter((day) => day.closedTrades > 0).slice(-30);
  const maxDailyAbs = Math.max(1, ...dailyBars.map((day) => Math.abs(day.pnl)));

  return (
    <div className="space-y-4 p-4 lg:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Net P&L"
          value={formatCompactMoney(report.netPnl)}
          detail={`${numberFormatter.format(report.closedTrades)} closed / ${numberFormatter.format(report.openTrades)} open`}
          tone={getMoneyTone(report.netPnl)}
        />
        <MetricCard
          label="Win Rate"
          value={formatPercent(report.winRate)}
          detail={`${numberFormatter.format(report.winningTrades)} wins, ${numberFormatter.format(report.losingTrades)} losses`}
        />
        <MetricCard
          label="Profit Factor"
          value={formatRatio(report.profitFactor)}
          detail={`${formatCompactMoney(report.grossProfit)} gross profit`}
        />
        <MetricCard
          label="Expectancy"
          value={formatCompactMoney(report.expectancy)}
          detail="Per closed trade"
          tone={getMoneyTone(report.expectancy)}
        />
        <MetricCard
          label="Logged Capital"
          value={formatCompactMoney(loggedCapital)}
          detail={`${numberFormatter.format(trades.length)} total records`}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.45fr)]">
        <section className="rounded-lg border border-[#E6E8EF] bg-white p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-semibold text-[#171923]">
                Performance Curve
              </h2>
              <p className="mt-1 text-[11px] text-[#697386]">
                {numberFormatter.format(report.activeDays)} active days
              </p>
            </div>
            <p
              className={`text-[13px] font-semibold ${getMetricValueClass(
                getMoneyTone(report.netPnl)
              )}`}
            >
              {formatMoney(report.netPnl)}
            </p>
          </div>
          <EquityChart report={report} chart={equityChart} />
        </section>

        <section className="rounded-lg border border-[#E6E8EF] bg-white p-4">
          <div className="mb-3">
            <h2 className="text-[13px] font-semibold text-[#171923]">
              Symbol Allocation
            </h2>
            <p className="mt-1 text-[11px] text-[#697386]">
              Based on {openTrades.length > 0 ? "open trade" : "logged trade"} cost basis
            </p>
          </div>

          {allocation.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-center text-sm text-[#697386]">
              No symbol exposure yet.
            </div>
          ) : (
            <div className="space-y-3">
              {allocation.map((item) => (
                <div key={item.symbol}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: item.color }}
                      />
                      <span className="font-medium text-[#171923]">{item.symbol}</span>
                    </div>
                    <span className="text-[#697386]">
                      {percentFormatter.format(item.percent)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EEF0F5]">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${clampScore(item.percent * 100)}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(280px,0.45fr)_minmax(0,1.55fr)]">
        <section className="rounded-lg border border-[#E6E8EF] bg-white p-4">
          <div className="mb-3">
            <h2 className="text-[13px] font-semibold text-[#171923]">Daily P&L</h2>
            <p className="mt-1 text-[11px] text-[#697386]">
              Last {numberFormatter.format(dailyBars.length)} realized days
            </p>
          </div>

          {dailyBars.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-center text-sm text-[#697386]">
              No realized daily P&L yet.
            </div>
          ) : (
            <div className="flex h-40 items-end gap-1 border-b border-[#E6E8EF] pb-2">
              {dailyBars.map((day) => {
                const barHeight = Math.max(8, (Math.abs(day.pnl) / maxDailyAbs) * 100);

                return (
                  <div
                    key={day.dateKey}
                    className="flex min-w-2 flex-1 items-end justify-center"
                    title={`${day.dateKey}: ${formatMoney(day.pnl)}`}
                  >
                    <div
                      className={`w-full rounded-t-sm ${
                        day.pnl >= 0 ? "bg-[#16A779]" : "bg-[#E25555]"
                      }`}
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-emerald-50 p-2">
              <p className="text-[10px] text-[#697386]">Best day</p>
              <p className="mt-1 truncate text-[13px] font-semibold text-[#16A779]">
                {formatOptionalMoney(report.bestDayPnl)}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-2">
              <p className="text-[10px] text-[#697386]">Worst day</p>
              <p className="mt-1 truncate text-[13px] font-semibold text-[#E25555]">
                {formatOptionalMoney(report.worstDayPnl)}
              </p>
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-[#E6E8EF] bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-semibold text-[#171923]">
                Recent Trades
              </h2>
              <p className="mt-1 text-[11px] text-[#697386]">
                Last {numberFormatter.format(recentTrades.length)} executions
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNav("trades")}
              className="h-7 rounded-md bg-[#6C5DD3]/10 px-2.5 text-[11px] font-medium text-[#6C5DD3] transition hover:bg-[#6C5DD3]/15 focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
            >
              View all
            </button>
          </div>

          {recentTrades.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-center text-sm text-[#697386]">
              No trades logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E8EF] text-left">
                    {["Symbol", "Direction", "P&L", "Return", "Status", "Date"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-2 py-2 text-[10px] font-medium text-[#697386]"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade) => {
                    const pnl = getTradePnl(trade);
                    const returnPct = getTradeReturnPct(trade);

                    return (
                      <tr key={trade.id} className="border-b border-[#F1F3F7] last:border-0">
                        <td className="px-2 py-2">
                          <div className="text-[12px] font-semibold text-[#171923]">
                            {trade.symbol}
                          </div>
                          <div className="text-[10px] text-[#697386]">Trade</div>
                        </td>
                        <td className="px-2 py-2">
                          <DirectionPill side={trade.side} />
                        </td>
                        <td
                          className={`px-2 py-2 text-right text-[12px] font-semibold ${
                            pnl === null
                              ? "text-[#697386]"
                              : pnl >= 0
                                ? "text-[#16A779]"
                                : "text-[#E25555]"
                          }`}
                        >
                          {pnl === null ? "Open" : formatMoney(pnl)}
                        </td>
                        <td
                          className={`px-2 py-2 text-[11px] font-medium ${
                            returnPct === null
                              ? "text-[#697386]"
                              : returnPct >= 0
                                ? "text-[#16A779]"
                                : "text-[#E25555]"
                          }`}
                        >
                          {formatPercent(returnPct)}
                        </td>
                        <td className="px-2 py-2">
                          <StatusPill trade={trade} />
                        </td>
                        <td className="px-2 py-2 text-[11px] text-[#697386]">
                          {formatShortDate(trade.closedAt ?? trade.openedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        {[
          {
            label: "Avg Win",
            value: formatCompactMoney(report.averageWin),
            tone: "profit" as const,
          },
          {
            label: "Avg Loss",
            value: formatCompactMoney(Math.abs(report.averageLoss)),
            tone: "loss" as const,
          },
          {
            label: "Score",
            value: ratioFormatter.format(score.score),
            tone: "neutral" as const,
          },
          {
            label: "Open Reviews",
            value: numberFormatter.format(openTrades.length),
            tone: "neutral" as const,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-[#E6E8EF] bg-white p-3.5"
          >
            <p className="text-[11px] text-[#697386]">{item.label}</p>
            <p
              className={`mt-1 text-[18px] font-bold ${getMetricValueClass(
                item.tone
              )}`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {openTrades.length > 0 ? (
        <section className="rounded-lg border border-[#E6E8EF] bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-semibold text-[#171923]">
                Today&apos;s Review
              </h2>
              <p className="mt-1 text-[11px] text-[#697386]">
                {numberFormatter.format(openTrades.length)} open trades on deck
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNav("journal")}
              className="h-7 rounded-md border border-[#6C5DD3] bg-[#6C5DD3]/5 px-2.5 text-[11px] font-medium text-[#6C5DD3]"
            >
              Open journal
            </button>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {openTrades.slice(0, 3).map((trade) => (
              <div key={trade.id} className="rounded-lg bg-[#F7F8FA] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-semibold text-[#171923]">
                    {trade.symbol}
                  </p>
                  <span className="text-[11px] text-[#697386]">
                    {numberFormatter.format(getOpenTradeAgeDays(trade, currentDate))}d
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#697386]">
                  {trade.notes || "No notes captured for this open trade."}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function PortfolioView({
  trades,
  report,
  equityChart,
  currentDate,
  onEdit,
}: {
  trades: TradeDto[];
  report: AnalyticsReport;
  equityChart: ReturnType<typeof getEquityChart>;
  currentDate: Date;
  onEdit: (trade: TradeDto) => void;
}) {
  const openTrades = trades.filter((trade) => trade.exit === null);
  const allocation = buildSymbolAllocation(trades);
  const loggedCapital = trades.reduce((sum, trade) => sum + getTradeNotional(trade), 0);
  const openCapital = openTrades.reduce((sum, trade) => sum + getTradeNotional(trade), 0);
  const averageOpenAge =
    openTrades.length > 0
      ? openTrades.reduce(
          (sum, trade) => sum + getOpenTradeAgeDays(trade, currentDate),
          0
        ) / openTrades.length
      : 0;

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-5">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          {
            label: "Logged Capital",
            value: formatCompactMoney(loggedCapital),
            sub: `${numberFormatter.format(trades.length)} total trades`,
            color: "#171923",
          },
          {
            label: "Realized P&L",
            value: formatCompactMoney(report.netPnl),
            sub: "Closed trades",
            color: report.netPnl >= 0 ? "#16A779" : "#E25555",
          },
          {
            label: "Open Capital",
            value: formatCompactMoney(openCapital),
            sub: "Open positions",
            color: "#3B82F6",
          },
          {
            label: "Open Positions",
            value: numberFormatter.format(openTrades.length),
            sub: `${ratioFormatter.format(averageOpenAge)}d avg age`,
            color: "#6C5DD3",
          },
        ].map((item) => (
          <AppCard key={item.label}>
            <div className="text-[11px] text-[#697386]">{item.label}</div>
            <div
              className="mt-1 truncate text-[20px] font-bold"
              style={{ color: item.color }}
            >
              {item.value}
            </div>
            <div className="mt-0.5 text-[11px] text-[#697386]">{item.sub}</div>
          </AppCard>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <AppCard className="xl:col-span-2">
          <SectionTitle>30-Day Performance</SectionTitle>
          <EquityChart report={report} chart={equityChart} />
        </AppCard>

        <AppCard>
          <SectionTitle>Symbol Allocation</SectionTitle>
          <div className="space-y-2">
            {allocation.length === 0 ? (
              <div className="flex h-44 items-center justify-center text-sm text-[#697386]">
                No allocation yet.
              </div>
            ) : (
              allocation.map((item) => (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between text-[11px]"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: item.color }}
                    />
                    <span className="truncate text-[#697386]">{item.symbol}</span>
                  </div>
                  <span className="font-medium text-[#171923]">
                    {percentFormatter.format(item.percent)}
                  </span>
                </div>
              ))
            )}
          </div>
        </AppCard>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#E6E8EF] bg-white">
        <div className="flex items-center border-b border-[#E6E8EF] px-4 py-3">
          <h2 className="text-[13px] font-semibold text-[#171923]">
            Open Positions
          </h2>
          <div className="ml-auto text-[12px] text-[#697386]">
            {numberFormatter.format(openTrades.length)} positions ·{" "}
            {formatMoney(openCapital)} deployed
          </div>
        </div>

        {openTrades.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No open positions"
              body="Trades without an exit price will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#E6E8EF] bg-[#F7F8FA]">
                  {["Symbol", "Side", "Qty", "Entry", "Exposure", "Age", "Notes", ""].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-4 py-2 text-left text-[10px] font-medium text-[#697386]"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {openTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-[#E6E8EF] transition-colors hover:bg-[#F7F8FA]"
                  >
                    <td className="px-4 py-2.5">
                      <div className="text-[13px] font-semibold text-[#171923]">
                        {trade.symbol}
                      </div>
                      <div className="text-[10px] text-[#697386]">Open trade</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <DirectionPill side={trade.side} />
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#171923]">
                      {numberFormatter.format(trade.quantity)}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#697386]">
                      {formatMoney(trade.entry)}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] font-medium text-[#171923]">
                      {formatMoney(getTradeNotional(trade))}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#697386]">
                      {numberFormatter.format(getOpenTradeAgeDays(trade, currentDate))}d
                    </td>
                    <td className="max-w-56 px-4 py-2.5 text-[11px] text-[#697386]">
                      <div className="truncate">{trade.notes || "No note"}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => onEdit(trade)}
                        className="rounded-lg bg-[#6C5DD3]/10 px-2 py-0.5 text-[11px] font-medium text-[#6C5DD3]"
                      >
                        Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function WatchlistView({
  trades,
  currentDate,
  onAddTrade,
}: {
  trades: TradeDto[];
  currentDate: Date;
  onAddTrade: () => void;
}) {
  const watchlistItems = useMemo(
    () => buildWatchlistItems(trades, currentDate),
    [currentDate, trades]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    watchlistItems.find((item) => item.id === selectedId) ?? watchlistItems[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[#F7F8FA]">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[#E6E8EF] bg-white px-5 py-3">
          <div className="text-[13px] font-semibold text-[#171923]">Watchlist</div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onAddTrade}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#6C5DD3] px-3 text-[12px] font-medium text-white"
          >
            <Plus size={12} aria-hidden="true" />
            Add Ticker
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-auto p-4">
          <div
            className="grid border-b border-[#E6E8EF] px-3 pb-2 text-[10px] font-medium text-[#697386]"
            style={{
              gridTemplateColumns:
                "minmax(100px,1.5fr) repeat(4,minmax(56px,1fr)) minmax(44px,0.6fr) minmax(100px,1.4fr) minmax(76px,1fr)",
            }}
          >
            <div>Ticker</div>
            <div className="text-right">Price</div>
            <div className="text-right">Entry</div>
            <div className="text-right">Stop</div>
            <div className="text-right">Target</div>
            <div className="text-right">R/R</div>
            <div className="text-center">Confidence</div>
            <div>Alert</div>
          </div>

          {watchlistItems.length === 0 ? (
            <EmptyState
              title="No watchlist rows"
              body="Add trades to derive watchlist levels from your entries."
            />
          ) : (
            watchlistItems.map((item) => {
              const risk = Math.abs(item.price - item.stop) || 1;
              const reward = Math.abs(item.target - item.price);
              const rr = reward / risk;
              const isSelected = selected?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="grid w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    gridTemplateColumns:
                      "minmax(100px,1.5fr) repeat(4,minmax(56px,1fr)) minmax(44px,0.6fr) minmax(100px,1.4fr) minmax(76px,1fr)",
                    background: "#fff",
                    border: `1px solid ${isSelected ? "#6C5DD3" : "#E6E8EF"}`,
                    boxShadow: isSelected ? "0 0 0 1px rgba(108,93,211,0.3)" : "none",
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#171923]">
                      {item.symbol}
                    </div>
                    <div className="truncate text-[10px] text-[#697386]">
                      {item.name}
                    </div>
                  </div>
                  <div className="text-right text-[12px] font-medium text-[#171923]">
                    {formatMoney(item.price)}
                  </div>
                  <div className="text-right text-[12px] text-[#697386]">
                    {formatMoney(item.targetEntry)}
                  </div>
                  <div className="text-right text-[12px] text-[#E25555]">
                    {formatMoney(item.stop)}
                  </div>
                  <div className="text-right text-[12px] text-[#16A779]">
                    {formatMoney(item.target)}
                  </div>
                  <div
                    className="text-right text-[12px] font-medium"
                    style={{ color: rr >= 2 ? "#16A779" : "#D99A20" }}
                  >
                    {ratioFormatter.format(rr)}x
                  </div>
                  <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                    <div className="h-1.5 min-w-0 flex-1 rounded-full bg-[#E6E8EF]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.confidence}%`,
                          background:
                            item.confidence >= 75
                              ? "#16A779"
                              : item.confidence >= 55
                                ? "#D99A20"
                                : "#E25555",
                        }}
                      />
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-[10px] text-[#697386]">
                      {ratioFormatter.format(item.confidence)}%
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        item.alertState === "Triggered"
                          ? "bg-emerald-50 text-[#16A779]"
                          : item.alertState === "Near Entry"
                            ? "bg-amber-50 text-[#D99A20]"
                            : "bg-[#F0F2F6] text-[#697386]"
                      }`}
                    >
                      {item.alertState}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {selected ? (
        <aside className="hidden w-[320px] shrink-0 flex-col overflow-y-auto border-l border-[#E6E8EF] bg-white lg:flex">
          <div className="border-b border-[#E6E8EF] p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[22px] font-bold text-[#171923]">
                  {selected.symbol}
                </div>
                <div className="text-[12px] text-[#697386]">{selected.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7F8FA]">
                  <Star size={13} color="#697386" aria-hidden="true" />
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7F8FA]">
                  <Bell size={13} color="#697386" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-4 text-[24px] font-bold text-[#171923]">
              {formatMoney(selected.price)}
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#697386]">
                Price Levels
              </div>
              <div className="space-y-2">
                {[
                  { label: "Target Entry", value: formatMoney(selected.targetEntry), color: "#6C5DD3" },
                  { label: "Stop Loss", value: formatMoney(selected.stop), color: "#E25555" },
                  { label: "Target Price", value: formatMoney(selected.target), color: "#16A779" },
                  {
                    label: "R/R Ratio",
                    value: `${ratioFormatter.format(
                      Math.abs(selected.target - selected.price) /
                        (Math.abs(selected.price - selected.stop) || 1)
                    )}x`,
                    color: "#171923",
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-[12px]">
                    <span className="text-[#697386]">{row.label}</span>
                    <span className="font-semibold" style={{ color: row.color }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#697386]">
                Thesis
              </div>
              <div className="rounded-lg bg-[#F7F8FA] p-3 text-[12px] leading-6 text-[#171923]">
                {selected.thesis}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#697386]">
                Review Date
              </div>
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-medium text-[#D99A20]">
                {selected.catalyst}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#697386]">
                Tags
              </div>
              <div className="flex flex-wrap gap-1">
                {selected.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-[#6C5DD3]/10 px-2 py-1 text-[11px] font-medium text-[#6C5DD3]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onAddTrade}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#6C5DD3] py-2 text-[12px] font-medium text-white"
            >
              <Plus size={12} aria-hidden="true" />
              Convert to Trade
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function OpenMonitorView({
  trades,
  currentDate,
  onEdit,
}: {
  trades: TradeDto[];
  currentDate: Date;
  onEdit: (trade: TradeDto) => void;
}) {
  const openTrades = trades.filter((trade) => trade.exit === null);

  if (openTrades.length === 0) {
    return (
      <div className="p-4 lg:p-5">
        <EmptyState
          title="No open trades"
          body="Trades with no exit price will appear here for review."
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-5">
      <div className="overflow-x-auto">
        <div className="min-w-[920px] space-y-3">
          <div className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.9fr_0.7fr_0.9fr_0.7fr] gap-3 px-4 text-[11px] font-semibold text-[#697386]">
            <span>Symbol</span>
            <span>Entry</span>
            <span>Qty</span>
            <span>Exposure</span>
            <span>Age</span>
            <span>Opened</span>
            <span>Review</span>
          </div>

          {openTrades.map((trade, index) => {
            const ageDays = getOpenTradeAgeDays(trade, currentDate);
            const reviewScore = clampScore(100 - Math.min(ageDays * 2, 65));

            return (
              <div
                key={trade.id}
                className={`grid min-h-24 grid-cols-[1.4fr_0.8fr_0.7fr_0.9fr_0.7fr_0.9fr_0.7fr] items-center gap-3 rounded-lg border bg-white px-4 py-3 ${
                  index === 0 ? "border-[#6C5DD3] shadow-[0_0_0_1px_#6C5DD3]" : "border-[#E6E8EF]"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-[#171923]">
                    {trade.symbol}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#697386]">
                    {trade.notes || "No journal note"}
                  </p>
                </div>
                <p className="text-[14px] font-semibold text-[#171923]">
                  {formatMoney(trade.entry)}
                </p>
                <p className="text-[13px] text-[#697386]">
                  {numberFormatter.format(trade.quantity)}
                </p>
                <p className="text-[13px] font-medium text-[#171923]">
                  {formatCompactMoney(getTradeNotional(trade))}
                </p>
                <p className="text-[13px] text-[#697386]">
                  {numberFormatter.format(ageDays)}d
                </p>
                <p className="text-[12px] text-[#697386]">
                  {formatShortDate(trade.openedAt)}
                </p>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-[#EEF0F5]">
                      <div
                        className="h-1.5 rounded-full bg-[#16A779]"
                        style={{ width: `${reviewScore}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#697386]">
                      {ratioFormatter.format(reviewScore)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEdit(trade)}
                    className="rounded bg-[#6C5DD3]/10 px-2 py-1 text-[11px] font-medium text-[#6C5DD3]"
                  >
                    Update
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalendarView({
  calendar,
  currentDate,
  onCalendarMonthChange,
}: {
  calendar: ReturnType<typeof buildCalendarMonth>;
  currentDate: Date;
  onCalendarMonthChange: (updater: (current: Date) => Date) => void;
}) {
  return (
    <div className="p-4 lg:p-5">
      <section className="rounded-lg border border-[#E6E8EF] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#E6E8EF] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-[#171923]">
              {calendar.monthLabel}
            </h2>
            <p className="mt-1 text-[11px] text-[#697386]">
              Realized P&L by activity date
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onCalendarMonthChange((current) => addUtcMonths(current, -1))
              }
              className="h-8 rounded-md border border-[#E6E8EF] bg-white px-3 text-[12px] font-medium text-[#697386] hover:bg-[#F7F8FA]"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => onCalendarMonthChange(() => startOfUtcMonth(currentDate))}
              className="h-8 rounded-md border border-[#E6E8EF] bg-white px-3 text-[12px] font-medium text-[#697386] hover:bg-[#F7F8FA]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() =>
                onCalendarMonthChange((current) => addUtcMonths(current, 1))
              }
              className="h-8 rounded-md border border-[#E6E8EF] bg-white px-3 text-[12px] font-medium text-[#697386] hover:bg-[#F7F8FA]"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <div className="grid min-w-[920px] grid-cols-[repeat(7,minmax(112px,1fr))_112px] gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="rounded-md bg-[#F7F8FA] px-3 py-2 text-center text-[10px] font-semibold text-[#697386]"
              >
                {day}
              </div>
            ))}
            <div className="rounded-md bg-[#F7F8FA] px-3 py-2 text-center text-[10px] font-semibold text-[#697386]">
              Week
            </div>

            {calendar.weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="contents">
                {week.days.map((day) => {
                  const dayTone =
                    day.pnl > 0 && day.isCurrentMonth
                      ? "border-emerald-100 bg-emerald-50"
                      : day.pnl < 0 && day.isCurrentMonth
                        ? "border-red-100 bg-red-50"
                        : day.isCurrentMonth
                          ? "border-[#E6E8EF] bg-white"
                          : "border-[#F1F3F7] bg-[#F7F8FA] text-[#A0A7B8]";

                  return (
                    <div
                      key={day.dateKey}
                      className={`flex min-h-28 flex-col rounded-md border p-3 ${dayTone}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium">{day.dayNumber}</span>
                        {day.closedTrades > 0 ? (
                          <span className="text-xs text-[#697386]">
                            {formatPercent(day.winRate)}
                          </span>
                        ) : null}
                      </div>

                      {day.trades > 0 ? (
                        <div className="mt-auto pt-3">
                          <p
                            className={`text-sm font-semibold ${getMetricValueClass(
                              getMoneyTone(day.pnl)
                            )}`}
                          >
                            {formatMoney(day.pnl)}
                          </p>
                          <p className="mt-1 text-xs text-[#697386]">
                            {numberFormatter.format(day.trades)}{" "}
                            {day.trades === 1 ? "trade" : "trades"}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                <div
                  className={`flex min-h-28 flex-col justify-between rounded-md border p-3 ${
                    week.summary.pnl > 0
                      ? "border-emerald-100 bg-emerald-50"
                      : week.summary.pnl < 0
                        ? "border-red-100 bg-red-50"
                        : "border-[#E6E8EF] bg-[#F7F8FA]"
                  }`}
                >
                  <p className="text-[10px] font-semibold text-[#697386]">
                    Week {weekIndex + 1}
                  </p>
                  {week.summary.activeDays > 0 ? (
                    <div>
                      <p
                        className={`text-sm font-semibold ${getMetricValueClass(
                          getMoneyTone(week.summary.pnl)
                        )}`}
                      >
                        {formatMoney(week.summary.pnl)}
                      </p>
                      <p className="mt-1 text-xs text-[#697386]">
                        {numberFormatter.format(week.summary.trades)} trades
                      </p>
                      <p className="mt-1 text-xs text-[#697386]">
                        {numberFormatter.format(week.summary.activeDays)} active days
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#A0A7B8]">No activity</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function AnalyticsView({
  report,
  score,
  radarPoints,
}: {
  report: AnalyticsReport;
  score: ReturnType<typeof buildScoreMetrics>;
  radarPoints: string;
}) {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(280px,0.42fr)_minmax(0,0.58fr)] lg:p-5">
      <section className="rounded-lg border border-[#E6E8EF] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-semibold text-[#171923]">
              MarketPilot Score
            </h2>
            <p className="mt-1 text-[11px] text-[#697386]">
              {numberFormatter.format(report.closedTrades)} closed trades
            </p>
          </div>
          <p className="text-[28px] font-bold leading-none text-[#171923]">
            {ratioFormatter.format(score.score)}
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <svg
            viewBox="0 0 100 100"
            className="h-52 w-52"
            role="img"
            aria-label="MarketPilot score radar"
          >
            <polygon
              points="50,8 89.9,37 74.7,84 25.3,84 10.1,37"
              fill="#F7F8FA"
              stroke="#E6E8EF"
              strokeWidth="0.8"
            />
            <polygon
              points="50,22 76.6,41.3 66.5,72.7 33.5,72.7 23.4,41.3"
              fill="none"
              stroke="#D8DCE7"
              strokeWidth="0.8"
            />
            <polygon
              points={radarPoints}
              fill="rgba(108, 93, 211, 0.18)"
              stroke="#6C5DD3"
              strokeWidth="1.6"
            />
          </svg>
        </div>

        <div className="mt-4 grid gap-3">
          {score.metrics.map((metric) => (
            <div key={metric.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-[#697386]">
                <span>{metric.label}</span>
                <span>{ratioFormatter.format(metric.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-[#EEF0F5]">
                <div
                  className="h-2 rounded-full bg-[#6C5DD3]"
                  style={{ width: `${clampScore(metric.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#E6E8EF] bg-white p-4">
        <h2 className="text-[14px] font-semibold text-[#171923]">
          Performance Breakdown
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            ["Gross profit", formatMoney(report.grossProfit), "profit" as const],
            ["Gross loss", formatMoney(report.grossLoss), "loss" as const],
            ["Best trade", formatOptionalMoney(report.bestTradePnl), "profit" as const],
            ["Worst trade", formatOptionalMoney(report.worstTradePnl), "loss" as const],
            ["Winning days", numberFormatter.format(report.winningDays), "neutral" as const],
            ["Losing days", numberFormatter.format(report.losingDays), "neutral" as const],
            ["Symbols traded", numberFormatter.format(report.symbolsTraded), "neutral" as const],
            ["Active days", numberFormatter.format(report.activeDays), "neutral" as const],
          ] satisfies Array<[string, string, MoneyTone]>).map(([label, value, tone]) => (
            <div key={label} className="rounded-lg bg-[#F7F8FA] p-3">
              <p className="text-[11px] text-[#697386]">{label}</p>
              <p
                className={`mt-1 truncate text-[15px] font-semibold ${getMetricValueClass(
                  tone
                )}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-[#E6E8EF] text-left">
                {["Date", "Trades", "Win Rate", "P&L", "Symbols"].map((heading) => (
                  <th
                    key={heading}
                    className="px-2 py-2 text-[10px] font-medium text-[#697386]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.daily.slice(-8).map((day) => (
                <tr key={day.dateKey} className="border-b border-[#F1F3F7] last:border-0">
                  <td className="px-2 py-2 text-[12px] font-medium text-[#171923]">
                    {day.dateKey}
                  </td>
                  <td className="px-2 py-2 text-[12px] text-[#697386]">
                    {numberFormatter.format(day.trades)}
                  </td>
                  <td className="px-2 py-2 text-[12px] text-[#697386]">
                    {formatPercent(day.winRate)}
                  </td>
                  <td
                    className={`px-2 py-2 text-[12px] font-semibold ${getMetricValueClass(
                      getMoneyTone(day.pnl)
                    )}`}
                  >
                    {formatMoney(day.pnl)}
                  </td>
                  <td className="px-2 py-2 text-[12px] text-[#697386]">
                    {day.symbols.slice(0, 3).join(", ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PlaybooksView({
  trades,
  currentDate,
  onEdit,
}: {
  trades: TradeDto[];
  currentDate: Date;
  onEdit: (trade: TradeDto) => void;
}) {
  const playbooks = useMemo(
    () => buildPlaybooks(trades, currentDate),
    [currentDate, trades]
  );
  const monthlyReturns = useMemo(() => buildMonthlyReturns(trades), [trades]);
  const returnDistribution = useMemo(
    () => buildReturnDistribution(trades),
    [trades]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    playbooks.find((playbook) => playbook.id === selectedId) ??
    playbooks[0] ??
    null;

  if (playbooks.length === 0) {
    return (
      <div className="p-4 lg:p-5">
        <EmptyState
          title="No playbooks yet"
          body="Add trades to derive long, short, and open-review playbooks from your history."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[#F7F8FA]">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E6E8EF] bg-white px-5 py-3">
          <div>
            <h2 className="text-[13px] font-semibold text-[#171923]">
              Playbooks
            </h2>
            <p className="mt-1 text-[11px] text-[#697386]">
              Repeatable setups derived from logged trades
            </p>
          </div>
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#6C5DD3] px-3 text-[12px] font-medium text-white"
          >
            <Plus size={12} aria-hidden="true" />
            New Playbook
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {playbooks.map((playbook) => {
            const isSelected = selected?.id === playbook.id;
            const winRatePct = playbook.winRate === null ? 0 : playbook.winRate * 100;

            return (
              <button
                key={playbook.id}
                type="button"
                onClick={() => setSelectedId(isSelected ? null : playbook.id)}
                className="w-full rounded-xl p-4 text-left transition-all"
                style={{
                  background: "#fff",
                  border: `1px solid ${isSelected ? "#6C5DD3" : "#E6E8EF"}`,
                  boxShadow: isSelected
                    ? "0 0 0 1px rgba(108,93,211,0.3)"
                    : "none",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[#171923]">
                      {playbook.name}
                    </div>
                    <div className="mt-1 max-w-3xl text-[12px] leading-5 text-[#697386]">
                      {playbook.description}
                    </div>
                  </div>
                  <BookMarked
                    size={15}
                    color={isSelected ? "#6C5DD3" : "#697386"}
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-5">
                  {[
                    {
                      label: "Win Rate",
                      value:
                        playbook.winRate === null
                          ? "-"
                          : formatPercent(playbook.winRate),
                      color: winRatePct >= 65 ? "#16A779" : "#D99A20",
                    },
                    {
                      label: "Avg Return",
                      value: `${playbook.avgReturn >= 0 ? "+" : ""}${ratioFormatter.format(
                        playbook.avgReturn
                      )}%`,
                      color: playbook.avgReturn >= 0 ? "#16A779" : "#E25555",
                    },
                    {
                      label: "Avg R",
                      value: `${ratioFormatter.format(playbook.avgRMultiple)}R`,
                      color: playbook.avgRMultiple >= 1 ? "#16A779" : "#D99A20",
                    },
                    {
                      label: "Trades",
                      value: numberFormatter.format(playbook.totalTrades),
                      color: "#171923",
                    },
                    {
                      label: "Avg Hold",
                      value: `${ratioFormatter.format(playbook.avgHoldDays)}d`,
                      color: "#171923",
                    },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div className="text-[10px] text-[#697386]">
                        {metric.label}
                      </div>
                      <div
                        className="mt-0.5 text-[16px] font-bold"
                        style={{ color: metric.color }}
                      >
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 h-1.5 rounded-full bg-[#E6E8EF]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${clampScore(winRatePct)}%`,
                      background: winRatePct >= 65 ? "#16A779" : "#D99A20",
                    }}
                  />
                </div>
              </button>
            );
          })}

          <div className="grid gap-3 xl:grid-cols-2">
            <AppCard>
              <SectionTitle>Monthly Returns</SectionTitle>
              {monthlyReturns.length === 0 ? (
                <div className="flex h-36 items-center justify-center text-sm text-[#697386]">
                  No closed monthly returns yet.
                </div>
              ) : (
                <>
                  <MiniBarChart
                    data={monthlyReturns}
                    valueKey="returnPct"
                    labelKey="month"
                  />
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {monthlyReturns.map((month) => (
                      <div key={month.month} className="rounded-lg bg-[#F7F8FA] p-2">
                        <p className="text-[10px] text-[#697386]">{month.month}</p>
                        <p
                          className={`mt-1 text-[13px] font-semibold ${getMetricValueClass(
                            getMoneyTone(month.returnPct)
                          )}`}
                        >
                          {month.returnPct >= 0 ? "+" : ""}
                          {ratioFormatter.format(month.returnPct)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </AppCard>

            <AppCard>
              <SectionTitle>Return Distribution</SectionTitle>
              <MiniBarChart
                data={returnDistribution}
                valueKey="count"
                labelKey="range"
                positiveColor="#6C5DD3"
                negativeColor="#6C5DD3"
              />
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {returnDistribution.map((bucket) => (
                  <div key={bucket.range} className="rounded-lg bg-[#F7F8FA] p-2">
                    <p className="text-[10px] text-[#697386]">{bucket.range}</p>
                    <p className="mt-1 text-[13px] font-semibold text-[#171923]">
                      {numberFormatter.format(bucket.count)}
                    </p>
                  </div>
                ))}
              </div>
            </AppCard>
          </div>
        </div>
      </div>

      {selected ? (
        <aside className="hidden w-[340px] shrink-0 overflow-y-auto border-l border-[#E6E8EF] bg-white lg:block">
          <div className="space-y-4 p-5">
            <div>
              <div className="text-[18px] font-bold text-[#171923]">
                {selected.name}
              </div>
              <div className="mt-1 text-[12px] leading-5 text-[#697386]">
                {selected.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Best Trade",
                  value: selected.bestTrade,
                  tone: "profit" as const,
                },
                {
                  label: "Worst Trade",
                  value: selected.worstTrade,
                  tone: "loss" as const,
                },
                {
                  label: "Total Trades",
                  value: numberFormatter.format(selected.totalTrades),
                  tone: "neutral" as const,
                },
                {
                  label: "Avg Hold",
                  value: `${ratioFormatter.format(selected.avgHoldDays)} days`,
                  tone: "neutral" as const,
                },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg bg-[#F7F8FA] p-3">
                  <p className="text-[10px] text-[#697386]">{metric.label}</p>
                  <p
                    className={`mt-1 truncate text-[13px] font-semibold ${getMetricValueClass(
                      metric.tone
                    )}`}
                  >
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#697386]">
                Entry Rules
              </div>
              <div className="space-y-1.5">
                {selected.rules.map((rule, index) => (
                  <div key={rule} className="flex items-start gap-2 text-[12px]">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#6C5DD3] text-[9px] font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="leading-5 text-[#171923]">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#697386]">
                Attached Trades
              </div>
              <div className="space-y-1.5">
                {selected.trades.slice(0, 6).map((trade) => {
                  const pnl = getTradePnl(trade);
                  const returnPct = getTradeReturnPct(trade);

                  return (
                    <button
                      key={trade.id}
                      type="button"
                      onClick={() => onEdit(trade)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg bg-[#F7F8FA] p-2 text-left"
                    >
                      <div className="min-w-0">
                        <span className="text-[12px] font-semibold text-[#171923]">
                          {trade.symbol}
                        </span>
                        <span className="ml-2 text-[11px] text-[#697386]">
                          {formatShortDate(trade.openedAt)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-[12px] font-semibold ${getMetricValueClass(
                            getMoneyTone(pnl)
                          )}`}
                        >
                          {pnl === null ? "Open" : formatMoney(pnl)}
                        </div>
                        <div className="text-[10px] text-[#697386]">
                          {formatPercent(returnPct)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function SettingsView({
  userName,
  userEmail,
  trades,
  report,
}: {
  userName: string;
  userEmail?: string | null;
  trades: TradeDto[];
  report: AnalyticsReport;
}) {
  const notedTrades = trades.filter((trade) => trade.notes?.trim()).length;
  const openTrades = trades.filter((trade) => trade.exit === null).length;

  return (
    <div className="space-y-4 p-4 lg:p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(280px,0.4fr)_minmax(0,0.6fr)]">
        <AppCard>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6C5DD3] text-[14px] font-bold text-white">
              {getInitials(userName)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-[#171923]">
                {userName}
              </div>
              <div className="truncate text-[12px] text-[#697386]">
                {userEmail ?? "No email available"}
              </div>
            </div>
          </div>
        </AppCard>

        <AppCard>
          <SectionTitle>Workspace Summary</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Total Trades", numberFormatter.format(trades.length)],
              ["Open Trades", numberFormatter.format(openTrades)],
              ["Closed Trades", numberFormatter.format(report.closedTrades)],
              ["Notes", numberFormatter.format(notedTrades)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[#F7F8FA] p-3">
                <p className="text-[10px] text-[#697386]">{label}</p>
                <p className="mt-1 text-[16px] font-bold text-[#171923]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </AppCard>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {[
          {
            title: "Data Integrity",
            rows: [
              ["Symbols tracked", numberFormatter.format(report.symbolsTraded)],
              ["Active days", numberFormatter.format(report.activeDays)],
              ["Winning days", numberFormatter.format(report.winningDays)],
              ["Losing days", numberFormatter.format(report.losingDays)],
            ],
          },
          {
            title: "Review Defaults",
            rows: [
              ["Base range", "All trades"],
              ["Calendar timezone", "UTC"],
              ["Date input", "24-hour supported"],
              ["Risk display", "Position cost basis"],
            ],
          },
          {
            title: "Account",
            rows: [
              ["Provider", "Google"],
              ["Workspace", "Main Portfolio"],
              ["Access", "Private"],
              ["Sync", "Manual refresh"],
            ],
          },
        ].map((section) => (
          <AppCard key={section.title}>
            <SectionTitle>{section.title}</SectionTitle>
            <div className="space-y-2 text-[12px]">
              {section.rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <span className="text-[#697386]">{label}</span>
                  <span className="text-right font-medium text-[#171923]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  );
}

function TradeLogView({
  trades,
  search,
  statusFilter,
  sideFilter,
  selectedTrade,
  deletingId,
  saving,
  onSearchChange,
  onStatusFilterChange,
  onSideFilterChange,
  onSelectTrade,
  onEdit,
  onDelete,
  onAddTrade,
}: {
  trades: TradeDto[];
  search: string;
  statusFilter: "all" | "open" | "closed";
  sideFilter: "all" | TradeSide;
  selectedTrade: TradeDto | null;
  deletingId: string | null;
  saving: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "open" | "closed") => void;
  onSideFilterChange: (value: "all" | TradeSide) => void;
  onSelectTrade: (trade: TradeDto | null) => void;
  onEdit: (trade: TradeDto) => void;
  onDelete: (trade: TradeDto) => void;
  onAddTrade: () => void;
}) {
  const totalPnl = trades
    .map(getTradePnl)
    .filter((pnl): pnl is number => pnl !== null)
    .reduce((sum, pnl) => sum + pnl, 0);
  const closedTrades = trades.filter((trade) => trade.exit !== null);
  const wins = closedTrades.filter((trade) => (getTradePnl(trade) ?? 0) > 0).length;
  const winRate = closedTrades.length > 0 ? wins / closedTrades.length : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E6E8EF] bg-white px-4 py-3 lg:px-5">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search symbol or notes"
          className="h-8 w-full rounded-md border border-[#E6E8EF] bg-[#F7F8FA] px-3 text-[12px] text-[#171923] outline-none placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10 sm:w-56"
        />

        <div className="flex gap-1">
          {(["all", "open", "closed"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onStatusFilterChange(option)}
              className={`h-8 rounded-md border px-2.5 text-[11px] font-medium capitalize ${
                statusFilter === option
                  ? "border-[#6C5DD3] bg-[#6C5DD3]/10 text-[#6C5DD3]"
                  : "border-[#E6E8EF] bg-white text-[#697386]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(["all", "buy", "sell"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSideFilterChange(option)}
              className={`h-8 rounded-md border px-2.5 text-[11px] font-medium capitalize ${
                sideFilter === option
                  ? "border-[#6C5DD3] bg-[#6C5DD3]/10 text-[#6C5DD3]"
                  : "border-[#E6E8EF] bg-white text-[#697386]"
              }`}
            >
              {option === "buy" ? "Long" : option === "sell" ? "Short" : "All"}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4 text-[11px]">
          <div>
            <span className="text-[#697386]">Showing </span>
            <span className="font-semibold text-[#171923]">
              {numberFormatter.format(trades.length)}
            </span>
          </div>
          <div>
            <span className="text-[#697386]">Win Rate </span>
            <span className="font-semibold text-[#16A779]">
              {formatPercent(winRate)}
            </span>
          </div>
          <div>
            <span className="text-[#697386]">Total P&L </span>
            <span
              className={`font-semibold ${getMetricValueClass(
                getMoneyTone(totalPnl)
              )}`}
            >
              {formatMoney(totalPnl)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddTrade}
          className="h-8 rounded-md bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white transition hover:bg-[#5B4BC7]"
        >
          Add Trade
        </button>
      </div>

      {trades.length === 0 ? (
        <div className="p-4 lg:p-5">
          <EmptyState
            title="No matching trades"
            body="Adjust the filters or add a new trade to populate the log."
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[980px] border-collapse bg-white">
              <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                <tr className="border-b border-[#E6E8EF] text-left">
                  {[
                    "Date",
                    "Symbol",
                    "Side",
                    "Entry",
                    "Exit",
                    "Qty",
                    "Size",
                    "P&L",
                    "Return",
                    "Status",
                    "Notes",
                    "",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-3 py-2 text-[10px] font-medium text-[#697386]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => {
                  const pnl = getTradePnl(trade);
                  const returnPct = getTradeReturnPct(trade);
                  const deleting = deletingId === trade.id;
                  const selected = selectedTrade?.id === trade.id;

                  return (
                    <tr
                      key={trade.id}
                      onClick={() => onSelectTrade(selected ? null : trade)}
                      className={`cursor-pointer border-b border-[#F1F3F7] transition ${
                        selected ? "bg-[#6C5DD3]/5" : "hover:bg-[#F7F8FA]"
                      } ${deleting ? "opacity-50" : ""}`}
                    >
                      <td className="px-3 py-2 text-[11px] text-[#697386]">
                        {formatShortDate(trade.openedAt)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[13px] font-semibold text-[#171923]">
                          {trade.symbol}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <DirectionPill side={trade.side} />
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] text-[#171923]">
                        {formatMoney(trade.entry)}
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] text-[#697386]">
                        {trade.exit === null ? "-" : formatMoney(trade.exit)}
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] text-[#171923]">
                        {numberFormatter.format(trade.quantity)}
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] text-[#697386]">
                        {formatCompactMoney(getTradeNotional(trade))}
                      </td>
                      <td
                        className={`px-3 py-2 text-right text-[12px] font-semibold ${
                          pnl === null
                            ? "text-[#697386]"
                            : pnl >= 0
                              ? "text-[#16A779]"
                              : "text-[#E25555]"
                        }`}
                      >
                        {pnl === null ? "Open" : formatMoney(pnl)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right text-[11px] font-medium ${
                          returnPct === null
                            ? "text-[#697386]"
                            : returnPct >= 0
                              ? "text-[#16A779]"
                              : "text-[#E25555]"
                        }`}
                      >
                        {formatPercent(returnPct)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill trade={trade} />
                      </td>
                      <td className="max-w-48 px-3 py-2 text-[11px] text-[#697386]">
                        <div className="truncate">{trade.notes || "-"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onEdit(trade);
                            }}
                            disabled={saving || deleting}
                            className="h-7 rounded-md border border-[#E6E8EF] px-2 text-[11px] font-medium text-[#697386] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDelete(trade);
                            }}
                            disabled={saving || deleting}
                            className="h-7 rounded-md border border-red-100 px-2 text-[11px] font-medium text-[#E25555] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deleting ? "Deleting" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedTrade ? (
            <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-[#E6E8EF] bg-white p-4 lg:block">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[22px] font-bold leading-tight text-[#171923]">
                    {selectedTrade.symbol}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusPill trade={selectedTrade} />
                    <span className="text-[11px] text-[#697386]">
                      {getDirectionLabel(selectedTrade.side)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTrade(null)}
                  className="text-[12px] text-[#697386]"
                >
                  x
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {([
                  {
                    label: "P&L",
                    value:
                      getTradePnl(selectedTrade) === null
                        ? "Open"
                        : formatMoney(getTradePnl(selectedTrade) ?? 0),
                    tone: getMoneyTone(getTradePnl(selectedTrade)),
                  },
                  {
                    label: "Return",
                    value: formatPercent(getTradeReturnPct(selectedTrade)),
                    tone: getMoneyTone(getTradeReturnPct(selectedTrade)),
                  },
                  {
                    label: "Position Size",
                    value: formatCompactMoney(getTradeNotional(selectedTrade)),
                    tone: "neutral" as const,
                  },
                  {
                    label: "Quantity",
                    value: numberFormatter.format(selectedTrade.quantity),
                    tone: "neutral" as const,
                  },
                ] satisfies Array<{ label: string; value: string; tone: MoneyTone }>).map((item) => (
                  <div key={item.label} className="rounded-lg bg-[#F7F8FA] p-2">
                    <p className="text-[10px] text-[#697386]">{item.label}</p>
                    <p
                      className={`mt-1 truncate text-[13px] font-semibold ${getMetricValueClass(
                        item.tone
                      )}`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 text-[12px]">
                {[
                  ["Entry Price", formatMoney(selectedTrade.entry)],
                  ["Exit Price", selectedTrade.exit ? formatMoney(selectedTrade.exit) : "-"],
                  ["Opened", formatDate(selectedTrade.openedAt)],
                  ["Closed", formatDate(selectedTrade.closedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <span className="text-[#697386]">{label}</span>
                    <span className="text-right font-medium text-[#171923]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className="mb-1 text-[11px] font-medium text-[#697386]">Notes</p>
                <div className="rounded-lg bg-[#F7F8FA] p-3 text-[12px] leading-5 text-[#171923]">
                  {selectedTrade.notes || "No notes captured."}
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </div>
  );
}

function TradeFormView({
  form,
  editingTrade,
  saving,
  error,
  trades,
  onUpdateForm,
  onSubmit,
  onReset,
  onEdit,
}: {
  form: TradeFormState;
  editingTrade: TradeDto | null;
  saving: boolean;
  error: string | null;
  trades: TradeDto[];
  onUpdateForm: <Key extends keyof TradeFormState>(
    key: Key,
    value: TradeFormState[Key]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onEdit: (trade: TradeDto) => void;
}) {
  const notedTrades = trades.filter((trade) => trade.notes).slice(0, 5);

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:p-5">
      <section className="rounded-lg border border-[#E6E8EF] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-semibold text-[#171923]">
              {editingTrade ? "Edit trade" : "New trade"}
            </h2>
            {editingTrade ? (
              <p className="mt-1 text-[11px] text-[#697386]">
                {editingTrade.symbol} opened {formatDate(editingTrade.openedAt)}
              </p>
            ) : null}
          </div>
          {editingTrade ? (
            <button
              type="button"
              onClick={onReset}
              className="h-8 rounded-md border border-[#E6E8EF] px-3 text-xs font-medium text-[#697386] transition hover:bg-[#F7F8FA] focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
            >
              Cancel
            </button>
          ) : null}
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
            Symbol
            <input
              value={form.symbol}
              onChange={(event) => onUpdateForm("symbol", event.target.value)}
              className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
              placeholder="AAPL"
              maxLength={20}
              disabled={saving}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
              Side
              <select
                value={form.side}
                onChange={(event) =>
                  onUpdateForm("side", event.target.value as TradeSide)
                }
                className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
                disabled={saving}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
              Quantity
              <input
                value={form.quantity}
                onChange={(event) => onUpdateForm("quantity", event.target.value)}
                className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
                inputMode="numeric"
                min="1"
                step="1"
                type="number"
                disabled={saving}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
              Entry
              <input
                value={form.entry}
                onChange={(event) => onUpdateForm("entry", event.target.value)}
                className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
                disabled={saving}
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
              Exit
              <input
                value={form.exit}
                onChange={(event) => onUpdateForm("exit", event.target.value)}
                className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
                disabled={saving}
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
            Opened
            <input
              value={form.openedAt}
              onChange={(event) => onUpdateForm("openedAt", event.target.value)}
              className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
              placeholder="2026-06-20 14:30"
              type="text"
              disabled={saving}
            />
            <span className="text-xs font-normal text-[#697386]">
              Use 24-hour time, for example 6/20 14:30 or 1430.
            </span>
          </label>

          <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
            Closed
            <input
              value={form.closedAt}
              onChange={(event) => onUpdateForm("closedAt", event.target.value)}
              className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
              placeholder="2026-06-20 15:45"
              type="text"
              disabled={saving}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => onUpdateForm("notes", event.target.value)}
              className="min-h-24 resize-y rounded-md border border-[#E6E8EF] bg-white px-3 py-2 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
              maxLength={5000}
              disabled={saving}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="mt-1 h-10 rounded-md bg-[#6C5DD3] px-4 text-sm font-semibold text-white transition hover:bg-[#5B4BC7] focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#A0A7B8]"
          >
            {saving
              ? "Saving..."
              : editingTrade
                ? "Save changes"
                : "Create trade"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-[#E6E8EF] bg-white p-4">
        <div className="mb-3">
          <h2 className="text-[14px] font-semibold text-[#171923]">
            Recent Notes
          </h2>
          <p className="mt-1 text-[11px] text-[#697386]">
            Notes stored on trade records
          </p>
        </div>

        {notedTrades.length === 0 ? (
          <EmptyState
            title="No notes yet"
            body="Add notes to a trade to build your journal history."
          />
        ) : (
          <div className="grid gap-3">
            {notedTrades.map((trade) => (
              <button
                key={trade.id}
                type="button"
                onClick={() => onEdit(trade)}
                className="rounded-lg border border-[#E6E8EF] bg-white p-3 text-left transition hover:border-[#6C5DD3]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#171923]">
                      {trade.symbol}
                    </p>
                    <p className="mt-1 text-[11px] text-[#697386]">
                      {formatShortDate(trade.openedAt)}
                    </p>
                  </div>
                  <StatusPill trade={trade} />
                </div>
                <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-[#4B5565]">
                  {trade.notes}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function TradeJournal({
  initialTrades,
  userName,
  userEmail,
  nowIso,
}: TradeJournalProps) {
  const [trades, setTrades] = useState(() =>
    sortTrades(initialTrades.map(normalizeTrade))
  );
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const [analyticsRange, setAnalyticsRange] =
    useState<AnalyticsRangeKey>("all");
  const [form, setForm] = useState<TradeFormState>(() => createEmptyForm(nowIso));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [tradeSearch, setTradeSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "open" | "closed">("all");
  const [sideFilter, setSideFilter] = useState<"all" | TradeSide>("all");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentDate = useMemo(() => new Date(nowIso), [nowIso]);
  const displayName = userName || userEmail || "Authenticated trader";

  const editingTrade = useMemo(
    () => trades.find((trade) => trade.id === editingId) ?? null,
    [editingId, trades]
  );
  const selectedTrade = useMemo(
    () => trades.find((trade) => trade.id === selectedTradeId) ?? null,
    [selectedTradeId, trades]
  );

  const analyticsReport = useMemo(
    () => createAnalyticsReport(trades, { range: analyticsRange, now: currentDate }),
    [analyticsRange, currentDate, trades]
  );
  const score = useMemo(
    () => buildScoreMetrics(analyticsReport),
    [analyticsReport]
  );
  const equityChart = useMemo(
    () => getEquityChart(analyticsReport.equityCurve),
    [analyticsReport.equityCurve]
  );
  const radarPoints = useMemo(() => getRadarPoints(score.metrics), [score.metrics]);
  const filteredTrades = useMemo(() => {
    const query = tradeSearch.trim().toLowerCase();

    return trades.filter((trade) => {
      if (
        query &&
        !trade.symbol.toLowerCase().includes(query) &&
        !(trade.notes ?? "").toLowerCase().includes(query)
      ) {
        return false;
      }

      if (statusFilter === "open" && trade.exit !== null) {
        return false;
      }

      if (statusFilter === "closed" && trade.exit === null) {
        return false;
      }

      if (sideFilter !== "all" && trade.side !== sideFilter) {
        return false;
      }

      return true;
    });
  }, [sideFilter, statusFilter, tradeSearch, trades]);

  function updateForm<Key extends keyof TradeFormState>(
    key: Key,
    value: TradeFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyForm(nowIso));
    setError(null);
  }

  function openNewTrade() {
    resetForm();
    setActiveView("journal");
  }

  function startEdit(trade: TradeDto) {
    setEditingId(trade.id);
    setForm(tradeToForm(trade));
    setError(null);
    setActiveView("journal");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = buildPayload(form, editingTrade);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingTrade ? `/api/trades/${editingTrade.id}` : "/api/trades",
        {
          method: editingTrade ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.payload),
        }
      );
      const body = await readApiBody(response);

      if (!response.ok || !body?.trade) {
        throw new Error(
          formatApiError(body, "Unable to save this trade. Try again.")
        );
      }

      const nextTrade = normalizeTrade(body.trade);
      setTrades((current) =>
        sortTrades(
          editingTrade
            ? current.map((trade) =>
                trade.id === nextTrade.id ? nextTrade : trade
              )
            : [nextTrade, ...current]
        )
      );
      setSelectedTradeId(nextTrade.id);
      resetForm();
      setActiveView("trades");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save this trade. Try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(trade: TradeDto) {
    if (!window.confirm(`Delete ${trade.symbol} trade?`)) {
      return;
    }

    setDeletingId(trade.id);
    setError(null);

    try {
      const response = await fetch(`/api/trades/${trade.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await readApiBody(response);
        throw new Error(
          formatApiError(body, "Unable to delete this trade. Try again.")
        );
      }

      setTrades((current) =>
        current.filter((currentTrade) => currentTrade.id !== trade.id)
      );

      if (editingId === trade.id) {
        resetForm();
      }

      if (selectedTradeId === trade.id) {
        setSelectedTradeId(null);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to delete this trade. Try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const meta = viewMeta[activeView];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#171923] lg:flex">
      <Sidebar
        activeView={activeView}
        userName={displayName}
        userEmail={userEmail}
        onAddTrade={openNewTrade}
        onNav={setActiveView}
      />

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          userName={displayName}
          analyticsRange={analyticsRange}
          onRangeChange={setAnalyticsRange}
        />
        <MobileNav activeView={activeView} onNav={setActiveView} />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {activeView === "dashboard" ? (
            <DashboardOverview
              trades={trades}
              report={analyticsReport}
              score={score}
              equityChart={equityChart}
              onNav={setActiveView}
              currentDate={currentDate}
            />
          ) : null}

          {activeView === "trades" ? (
            <TradeLogView
              trades={filteredTrades}
              search={tradeSearch}
              statusFilter={statusFilter}
              sideFilter={sideFilter}
              selectedTrade={selectedTrade}
              deletingId={deletingId}
              saving={saving}
              onSearchChange={setTradeSearch}
              onStatusFilterChange={setStatusFilter}
              onSideFilterChange={setSideFilter}
              onSelectTrade={(trade) => setSelectedTradeId(trade?.id ?? null)}
              onEdit={startEdit}
              onDelete={handleDelete}
              onAddTrade={openNewTrade}
            />
          ) : null}

          {activeView === "playbooks" ? (
            <PlaybooksView
              trades={trades}
              currentDate={currentDate}
              onEdit={startEdit}
            />
          ) : null}

          {activeView === "analytics" ? (
            <AnalyticsView
              report={analyticsReport}
              score={score}
              radarPoints={radarPoints}
            />
          ) : null}

          {activeView === "journal" ? (
            <TradeFormView
              form={form}
              editingTrade={editingTrade}
              saving={saving}
              error={error}
              trades={trades}
              onUpdateForm={updateForm}
              onSubmit={handleSubmit}
              onReset={resetForm}
              onEdit={startEdit}
            />
          ) : null}

          {activeView === "settings" ? (
            <SettingsView
              userName={displayName}
              userEmail={userEmail}
              trades={trades}
              report={analyticsReport}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
