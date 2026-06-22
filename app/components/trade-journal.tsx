"use client";

import { useMemo, useRef, useEffect, useState, type FormEvent } from "react";
import {
  Award,
  BarChart2,
  Bell,
  BookMarked,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Edit3,
  LayoutDashboard,
  List,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Target,
  TrendingUp,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOutUser } from "@/app/actions/auth";
import {
  formatTradeDateInput,
  parseTradeDateInput,
} from "@/lib/trades/date-input";
import {
  createAnalyticsReport,
  getTradePnl,
  type AnalyticsRangeKey,
  type AnalyticsReport,
  type EquityPoint,
} from "@/lib/analytics/report";
import type { PlaybookDto, PlaybookPayload } from "@/lib/playbooks/types";
import type { TradeDto, TradePayload, TradeSide } from "@/lib/trades/types";

type TradeJournalProps = {
  initialTrades: TradeDto[];
  initialPlaybooks: PlaybookDto[];
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
  playbookId: string;
  symbol: string;
  side: TradeSide;
  openedAt: string;
  riskDollars: string;
  rMultiple: string;
  tradeIdea: string;
  confluences: string;
};

type PlaybookFormState = {
  name: string;
  description: string;
  color: string;
  rules: string[];
};

type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
};

type ApiTradeBody = {
  trade?: TradeDto;
  playbook?: PlaybookDto;
  error?: string;
  issues?: ApiIssue[];
};

type MoneyTone = "neutral" | "profit" | "loss";

type PlaybookSummary = {
  id: string;
  name: string;
  description: string;
  color: string;
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
    playbookId: "",
    symbol: "",
    side: "long",
    openedAt: formatTradeDateInput(nowIso),
    riskDollars: "",
    rMultiple: "",
    tradeIdea: "",
    confluences: "",
  };
}

function tradeToForm(trade: TradeDto): TradeFormState {
  return {
    playbookId: trade.playbookId,
    symbol: trade.symbol,
    side: trade.side,
    openedAt: formatTradeDateInput(trade.openedAt),
    riskDollars: String(trade.riskDollars),
    rMultiple: String(trade.rMultiple),
    tradeIdea: trade.journalEntry?.tradeIdea ?? "",
    confluences: trade.journalEntry?.confluences ?? "",
  };
}

function createEmptyPlaybookForm(): PlaybookFormState {
  return {
    name: "",
    description: "",
    color: "#6C5DD3",
    rules: ["", "", "", ""],
  };
}

function playbookToForm(playbook: PlaybookDto): PlaybookFormState {
  const rules = playbook.rules.length > 0 ? playbook.rules : ["", "", "", ""];
  return {
    name: playbook.name,
    description: playbook.description,
    color: playbook.color,
    rules,
  };
}

function normalizeTrade(trade: TradeDto): TradeDto {
  return {
    ...trade,
    playbookId: trade.playbookId ?? "",
    openedAt: new Date(trade.openedAt).toISOString(),
    createdAt: new Date(trade.createdAt).toISOString(),
    updatedAt: new Date(trade.updatedAt).toISOString(),
    journalEntry: trade.journalEntry
      ? {
          ...trade.journalEntry,
          createdAt: new Date(trade.journalEntry.createdAt).toISOString(),
          updatedAt: new Date(trade.journalEntry.updatedAt).toISOString(),
        }
      : null,
  };
}

function normalizePlaybook(playbook: PlaybookDto): PlaybookDto {
  return {
    ...playbook,
    color: playbook.color.toUpperCase(),
    createdAt: new Date(playbook.createdAt).toISOString(),
    updatedAt: new Date(playbook.updatedAt).toISOString(),
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

function sortPlaybooks(playbooks: PlaybookDto[]) {
  return [...playbooks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
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
    return "-";
  }

  return `${dateFormatter.format(new Date(iso))} UTC`;
}

function formatShortDate(iso: string | null) {
  if (!iso) {
    return "-";
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

  if (pnl > 0) {
    return "WIN";
  }

  if (pnl < 0) {
    return "LOSS";
  }

  return "FLAT";
}

function getDirectionLabel(side: TradeSide) {
  return side === "long" ? "Long" : "Short";
}

function getTradeRisk(trade: TradeDto) {
  return trade.riskDollars;
}

function getTradeRMultiple(trade: TradeDto) {
  return trade.rMultiple;
}

function getTradeHoldDays(trade: TradeDto, now: Date) {
  const openedAt = new Date(trade.openedAt).getTime();
  const endedAt = now.getTime();

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
  const totals = new Map<string, number>();

  for (const trade of trades) {
    totals.set(trade.symbol, (totals.get(trade.symbol) ?? 0) + getTradeRisk(trade));
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
  const monthly = new Map<string, { label: string; pnl: number; risk: number }>();

  for (const trade of trades) {
    const pnl = getTradePnl(trade);
    const date = new Date(trade.openedAt);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth()).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("en-US", {
      month: "short",
      timeZone: "UTC",
    }).format(date);
    const current = monthly.get(key) ?? { label, pnl: 0, risk: 0 };
    current.pnl += pnl;
    current.risk += getTradeRisk(trade);
    monthly.set(key, current);
  }

  return [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, month]) => ({
      month: month.label,
      returnPct: month.risk > 0 ? month.pnl / month.risk : 0,
      pnl: month.pnl,
    }));
}

function buildReturnDistribution(trades: TradeDto[]) {
  const buckets = [
    { range: "< -2R", count: 0 },
    { range: "-2R to -1R", count: 0 },
    { range: "-1R to 0R", count: 0 },
    { range: "0R to 1R", count: 0 },
    { range: "1R to 2R", count: 0 },
    { range: "> 2R", count: 0 },
  ];

  for (const trade of trades) {
    const value = getTradeRMultiple(trade);

    if (value < -2) {
      buckets[0].count += 1;
    } else if (value < -1) {
      buckets[1].count += 1;
    } else if (value < 0) {
      buckets[2].count += 1;
    } else if (value < 1) {
      buckets[3].count += 1;
    } else if (value < 2) {
      buckets[4].count += 1;
    } else {
      buckets[5].count += 1;
    }
  }

  return buckets;
}

function buildPlaybooks(
  playbooks: PlaybookDto[],
  trades: TradeDto[],
  now: Date
): PlaybookSummary[] {
  return playbooks.map((playbook) => {
    const assignedTrades = trades.filter((trade) => trade.playbookId === playbook.id);
    const wins = assignedTrades.filter((trade) => getTradePnl(trade) > 0);
    const sorted = [...assignedTrades].sort((a, b) => getTradePnl(b) - getTradePnl(a));
    const averageReturn =
      assignedTrades.length > 0
        ? assignedTrades.reduce((total, trade) => total + getTradePnl(trade), 0) /
          assignedTrades.length
        : 0;
    const averageRMultiple =
      assignedTrades.length > 0
        ? assignedTrades.reduce((total, trade) => total + getTradeRMultiple(trade), 0) /
          assignedTrades.length
        : 0;
    const averageHoldDays =
      assignedTrades.length > 0
        ? assignedTrades.reduce(
            (total, trade) => total + getTradeHoldDays(trade, now),
            0
          ) / assignedTrades.length
        : 0;

    return {
      id: playbook.id,
      name: playbook.name,
      description: playbook.description,
      color: playbook.color,
      rules: playbook.rules,
      trades: assignedTrades,
      winRate: assignedTrades.length > 0 ? wins.length / assignedTrades.length : null,
      avgReturn: averageReturn,
      avgRMultiple: averageRMultiple,
      totalTrades: assignedTrades.length,
      avgHoldDays: averageHoldDays,
      bestTrade: sorted[0]
        ? `${sorted[0].symbol} ${formatMoney(getTradePnl(sorted[0]))}`
        : "-",
      worstTrade: sorted[sorted.length - 1]
        ? `${sorted[sorted.length - 1].symbol} ${formatMoney(
            getTradePnl(sorted[sorted.length - 1])
          )}`
        : "-",
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
  form: TradeFormState
): { payload: TradePayload; error: null } | { payload: null; error: string } {
  const playbookId = form.playbookId.trim();
  const symbol = form.symbol.trim().toUpperCase();
  const riskDollars = Number(form.riskDollars);
  const rMultiple = Number(form.rMultiple);
  const openedAtResult = parseTradeDateInput(form.openedAt);
  const tradeIdea = form.tradeIdea.trim();
  const confluences = form.confluences.trim();

  if (!playbookId) {
    return { payload: null, error: "Select a Playbook before saving." };
  }

  if (!symbol) {
    return { payload: null, error: "Symbol is required." };
  }

  if (!Number.isFinite(riskDollars) || riskDollars <= 0) {
    return { payload: null, error: "Risk must be a positive number." };
  }

  if (!Number.isFinite(rMultiple)) {
    return { payload: null, error: "R multiple must be a number." };
  }

  if (!tradeIdea) {
    return { payload: null, error: "Trade idea is required." };
  }

  if (!confluences) {
    return { payload: null, error: "Confluences are required." };
  }

  if (!openedAtResult.ok) {
    return { payload: null, error: `Trade date: ${openedAtResult.error}` };
  }

  const payload: TradePayload = {
    playbookId,
    symbol,
    side: form.side,
    riskDollars,
    rMultiple,
    openedAt: openedAtResult.iso,
    tradeIdea,
    confluences,
  };

  return { payload, error: null };
}

function buildPlaybookPayload(
  form: PlaybookFormState
): { payload: PlaybookPayload; error: null } | { payload: null; error: string } {
  const name = form.name.trim();
  const description = form.description.trim();
  const color = form.color.trim().toUpperCase();
  const rules = form.rules.map((r) => r.trim()).filter(Boolean);

  if (!name) {
    return { payload: null, error: "Playbook name is required." };
  }

  if (!description) {
    return { payload: null, error: "Playbook description is required." };
  }

  if (!/^#[0-9A-F]{6}$/.test(color)) {
    return { payload: null, error: "Color must be a hex value like #6C5DD3." };
  }

  if (rules.length === 0) {
    return { payload: null, error: "At least one Playbook Rule is required." };
  }

  return {
    payload: {
      name,
      description,
      color,
      rules,
    },
    error: null,
  };
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
  const isLong = side === "long";

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
}: {
  trades: TradeDto[];
  report: AnalyticsReport;
  score: ReturnType<typeof buildScoreMetrics>;
  equityChart: ReturnType<typeof getEquityChart>;
  onNav: (view: DashboardView) => void;
}) {
  const recentTrades = trades.slice(0, 8);
  const allocation = buildSymbolAllocation(trades);
  const loggedRisk = trades.reduce((sum, trade) => sum + getTradeRisk(trade), 0);
  const dailyBars = report.daily.filter((day) => day.closedTrades > 0).slice(-30);
  const maxDailyAbs = Math.max(1, ...dailyBars.map((day) => Math.abs(day.pnl)));

  return (
    <div className="space-y-4 p-4 lg:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Net P&L"
          value={formatCompactMoney(report.netPnl)}
          detail={`${numberFormatter.format(report.closedTrades)} completed trades`}
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
          detail="Per completed trade"
          tone={getMoneyTone(report.expectancy)}
        />
        <MetricCard
          label="Logged Risk"
          value={formatCompactMoney(loggedRisk)}
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
              Based on logged risk by symbol
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
                    {["Symbol", "Direction", "P&L", "R", "Result", "Date"].map(
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
                            pnl >= 0
                                ? "text-[#16A779]"
                                : "text-[#E25555]"
                          }`}
                        >
                          {formatMoney(pnl)}
                        </td>
                        <td
                          className={`px-2 py-2 text-[11px] font-medium ${
                            trade.rMultiple >= 0
                                ? "text-[#16A779]"
                                : "text-[#E25555]"
                          }`}
                        >
                          {formatRatio(trade.rMultiple)}R
                        </td>
                        <td className="px-2 py-2">
                          <StatusPill trade={trade} />
                        </td>
                        <td className="px-2 py-2 text-[11px] text-[#697386]">
                          {formatShortDate(trade.openedAt)}
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
            label: "Journaled",
            value: numberFormatter.format(
              trades.filter((trade) => trade.journalEntry).length
            ),
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

      {recentTrades.length > 0 ? (
        <section className="rounded-lg border border-[#E6E8EF] bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-semibold text-[#171923]">
                Today&apos;s Review
              </h2>
              <p className="mt-1 text-[11px] text-[#697386]">
                {numberFormatter.format(recentTrades.length)} recent completed trades
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
            {recentTrades.slice(0, 3).map((trade) => (
              <div key={trade.id} className="rounded-lg bg-[#F7F8FA] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-semibold text-[#171923]">
                    {trade.symbol}
                  </p>
                  <span className="text-[11px] text-[#697386]">
                    {formatRatio(trade.rMultiple)}R
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#697386]">
                  {trade.journalEntry?.tradeIdea || "No trade idea captured."}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
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

const PLAYBOOK_COLORS = ["#6C5DD3", "#16A779", "#3B82F6", "#D99A20", "#E25555", "#8B5CF6"];

function PlaybooksView({
  storedPlaybooks,
  trades,
  currentDate,
  form,
  editingPlaybook,
  saving,
  deletingId,
  error,
  showModal,
  onUpdateForm,
  onSubmit,
  onNew,
  onEditPlaybook,
  onDeletePlaybook,
  onCancel,
  onEdit,
  onLogTrade,
}: {
  storedPlaybooks: PlaybookDto[];
  trades: TradeDto[];
  currentDate: Date;
  form: PlaybookFormState;
  editingPlaybook: PlaybookDto | null;
  saving: boolean;
  deletingId: string | null;
  error: string | null;
  showModal: boolean;
  onUpdateForm: <Key extends keyof PlaybookFormState>(
    key: Key,
    value: PlaybookFormState[Key]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onEditPlaybook: (playbook: PlaybookDto) => void;
  onDeletePlaybook: (playbook: PlaybookDto) => void;
  onCancel: () => void;
  onEdit: (trade: TradeDto) => void;
  onLogTrade: (playbookId: string) => void;
}) {
  const playbooks = useMemo(
    () => buildPlaybooks(storedPlaybooks, trades, currentDate),
    [currentDate, storedPlaybooks, trades]
  );
  const monthlyReturns = useMemo(() => buildMonthlyReturns(trades), [trades]);
  const returnDistribution = useMemo(
    () => buildReturnDistribution(trades),
    [trades]
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    () => storedPlaybooks[0]?.id ?? null
  );

  const prevCountRef = useRef(storedPlaybooks.length);
  useEffect(() => {
    if (storedPlaybooks.length > prevCountRef.current) {
      const newest = storedPlaybooks[storedPlaybooks.length - 1];
      if (newest) setSelectedId(newest.id);
    }
    prevCountRef.current = storedPlaybooks.length;
  }, [storedPlaybooks]);

  const selected =
    playbooks.find((playbook) => playbook.id === selectedId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[#F7F8FA]">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E6E8EF] bg-white px-5 py-3">
          <h2 className="text-[13px] font-semibold text-[#171923]">Playbooks</h2>
          <button
            type="button"
            onClick={onNew}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#6C5DD3] px-3 text-[12px] font-medium text-white"
          >
            <Plus size={12} aria-hidden="true" />
            New Playbook
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4" onClick={() => setSelectedId(null)}>
          {playbooks.length === 0 ? (
            <EmptyState
              title="No Playbooks yet"
              body="Create a Playbook to define reusable setup rules."
            />
          ) : null}

          {playbooks.map((playbook) => {
            const isSelected = selected?.id === playbook.id;
            const winRatePct = playbook.winRate === null ? 0 : playbook.winRate * 100;
            const deleting = deletingId === playbook.id;
            const sourcePlaybook = storedPlaybooks.find(
              (item) => item.id === playbook.id
            );

            return (
              <article
                key={playbook.id}
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
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedId(isSelected ? null : playbook.id); }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="text-[14px] font-semibold text-[#171923]">
                      {playbook.name}
                    </div>
                    <div className="mt-1 max-w-3xl text-[12px] leading-5 text-[#697386]">
                      {playbook.description}
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (sourcePlaybook) {
                          onEditPlaybook(sourcePlaybook);
                        }
                      }}
                      disabled={saving || deleting || !sourcePlaybook}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E6E8EF] text-[#697386] hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Edit ${playbook.name}`}
                    >
                      <Edit3 size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (sourcePlaybook) {
                          onDeletePlaybook(sourcePlaybook);
                        }
                      }}
                      disabled={saving || deleting || !sourcePlaybook}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-red-100 text-[#E25555] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Delete ${playbook.name}`}
                    >
                      {deleting ? (
                        <RefreshCw size={14} aria-hidden="true" />
                      ) : (
                        <Trash2 size={14} aria-hidden="true" />
                      )}
                    </button>
                    <ChevronRight
                      size={15}
                      color={isSelected ? "#6C5DD3" : "#697386"}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-end justify-between gap-4">
                  <div className="grid grid-cols-4 gap-8">
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
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="text-[10px] text-[#697386]">{metric.label}</div>
                        <div className="mt-0.5 text-[16px] font-bold" style={{ color: metric.color }}>
                          {metric.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-[#16A779]">
                      Best: {playbook.bestTrade}
                    </span>
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-[#E25555]">
                      Worst: {playbook.worstTrade}
                    </span>
                  </div>
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
              </article>
            );
          })}

        </div>
      </div>

      {showModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={(e) => e.target === e.currentTarget && onCancel()}
        >
          <div className="flex w-full max-w-[540px] flex-col rounded-2xl bg-white shadow-2xl" style={{ maxHeight: "88vh" }}>
            <div className="flex shrink-0 items-center justify-between border-b border-[#E6E8EF] px-6 py-5">
              <div>
                <p className="text-[20px] font-bold text-[#171923]">
                  {editingPlaybook ? "Edit Playbook" : "New Playbook"}
                </p>
                <p className="mt-0.5 text-[13px] text-[#697386]">
                  {editingPlaybook ? "Update the definition fields and rules." : "Define a repeatable setup strategy"}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7F8FA] text-[#697386] hover:bg-[#EEF0F5] disabled:opacity-50"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex min-h-0 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {error ? (
                  <p role="alert" className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}

                <div className="flex items-start gap-4">
                  <label className="grid min-w-0 flex-1 gap-1.5 text-[13px] font-semibold text-[#171923]">
                    <span>Playbook Name <span className="text-[#E25555]">*</span></span>
                    <input
                      value={form.name}
                      onChange={(e) => onUpdateForm("name", e.target.value)}
                      placeholder="e.g. Breakout Setup"
                      maxLength={80}
                      disabled={saving}
                      className="h-10 w-full rounded-xl border border-[#E6E8EF] bg-[#F7F8FA] px-3 text-[13px] text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
                    />
                  </label>
                  <div className="grid gap-1.5 text-[13px] font-semibold text-[#171923]">
                    Color
                    <div className="flex h-10 items-center gap-2">
                      {PLAYBOOK_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => onUpdateForm("color", c)}
                          disabled={saving}
                          className="h-7 w-7 shrink-0 rounded-full transition disabled:opacity-50"
                          style={{
                            background: c,
                            outline: form.color.toUpperCase() === c.toUpperCase() ? `2px solid #171923` : "none",
                            outlineOffset: 2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <label className="grid gap-1.5 text-[13px] font-semibold text-[#171923]">
                  <span>Description <span className="text-[#E25555]">*</span></span>
                  <textarea
                    value={form.description}
                    onChange={(e) => onUpdateForm("description", e.target.value)}
                    placeholder="Describe the setup, what you're looking for, and when to use it..."
                    rows={4}
                    maxLength={500}
                    disabled={saving}
                    className="w-full resize-none rounded-xl border border-[#E6E8EF] bg-[#F7F8FA] px-3 py-2.5 text-[13px] text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
                  />
                </label>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#171923]">Entry Rules</span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onUpdateForm("rules", [...form.rules, ""])}
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#6C5DD3] hover:opacity-75 disabled:opacity-50"
                    >
                      <Plus size={13} aria-hidden="true" />
                      Add Rule
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {form.rules.map((rule, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                          style={{ background: form.color }}
                        >
                          {i + 1}
                        </div>
                        <input
                          value={rule}
                          onChange={(e) => {
                            const next = [...form.rules];
                            next[i] = e.target.value;
                            onUpdateForm("rules", next);
                          }}
                          placeholder={`Rule ${i + 1}...`}
                          disabled={saving}
                          className="h-10 min-w-0 flex-1 rounded-xl border border-[#E6E8EF] bg-[#F7F8FA] px-3 text-[13px] text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => onUpdateForm("rules", form.rules.filter((_, j) => j !== i))}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#E25555] hover:bg-red-50 disabled:opacity-50"
                          aria-label={`Remove rule ${i + 1}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between border-t border-[#E6E8EF] px-6 py-4">
                <p className="text-[12px] text-[#697386]">
                  {form.name.trim() && form.description.trim()
                    ? <span className="font-semibold text-[#171923]">{form.name.trim()}</span>
                    : "Fill in name and description to continue"
                  }
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="h-10 rounded-xl border border-[#E6E8EF] px-5 text-[13px] font-semibold text-[#171923] transition hover:bg-[#F7F8FA] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !form.name.trim() || !form.description.trim()}
                    className="flex h-10 items-center gap-1.5 rounded-xl bg-[#6C5DD3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#5B4BC7] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={13} aria-hidden="true" />
                    {saving ? "Saving…" : editingPlaybook ? "Save Playbook" : "Create Playbook"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
              {(() => {
                const winRatePct = selected.winRate === null ? 0 : selected.winRate * 100;
                return [
                  {
                    icon: TrendingUp,
                    label: "Win Rate",
                    value: selected.winRate === null ? "-" : formatPercent(selected.winRate),
                    color: winRatePct >= 65 ? "#16A779" : "#D99A20",
                  },
                  {
                    icon: Target,
                    label: "Avg Return",
                    value: `${selected.avgReturn >= 0 ? "+" : ""}${ratioFormatter.format(selected.avgReturn)}%`,
                    color: selected.avgReturn >= 0 ? "#16A779" : "#E25555",
                  },
                  {
                    icon: Award,
                    label: "Avg R Multiple",
                    value: `${ratioFormatter.format(selected.avgRMultiple)}R`,
                    color: selected.avgRMultiple >= 1.5 ? "#16A779" : "#D99A20",
                  },
                  {
                    icon: TrendingUp,
                    label: "Total Trades",
                    value: numberFormatter.format(selected.totalTrades),
                    color: "#171923",
                  },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="rounded-xl bg-[#F7F8FA] p-3">
                    <p className="mb-0.5 text-[10px] text-[#697386]">{label}</p>
                    <p className="text-[18px] font-bold" style={{ color }}>{value}</p>
                  </div>
                ));
              })()}
            </div>

            {selected.rules.length > 0 ? (
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
            ) : null}

            {selected.trades.length > 0 ? (
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#697386]">
                  Attached Trades
                </div>
                <div className="space-y-1.5">
                  {selected.trades.slice(0, 6).map((trade) => {
                    const pnl = getTradePnl(trade);
                    return (
                      <button
                        key={trade.id}
                        type="button"
                        onClick={() => onEdit(trade)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg bg-[#F7F8FA] p-2 text-left"
                      >
                        <div className="min-w-0">
                          <span className="text-[12px] font-semibold text-[#171923]">{trade.symbol}</span>
                          <span className="ml-2 text-[11px] text-[#697386]">{formatShortDate(trade.openedAt)}</span>
                        </div>
                        <div className="text-right">
                          <div className={`text-[12px] font-semibold ${getMetricValueClass(getMoneyTone(pnl))}`}>
                            {formatMoney(pnl)}
                          </div>
                          <div className="text-[10px] text-[#697386]">{formatRatio(trade.rMultiple)}R</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#697386]">
                Performance
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#697386]">Best Trade</span>
                  <span className="font-semibold text-[#16A779]">{selected.bestTrade}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#697386]">Worst Trade</span>
                  <span className="font-semibold text-[#E25555]">{selected.worstTrade}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onLogTrade(selected.id)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#6C5DD3] py-2 text-[12px] font-medium text-white transition hover:bg-[#5B4BC7]"
            >
              Log Trade with This Playbook
            </button>
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
  const journaledTrades = trades.filter((trade) => trade.journalEntry).length;

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
              ["Completed Trades", numberFormatter.format(report.closedTrades)],
              ["Journal Entries", numberFormatter.format(journaledTrades)],
              ["Total Risk", formatCompactMoney(
                trades.reduce((sum, trade) => sum + trade.riskDollars, 0)
              )],
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
              ["Risk display", "P&L and return"],
            ],
          },
          {
            title: "Account",
            rows: [
              ["Provider", "Google"],
              ["Workspace", "Futures Journal"],
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
  resultFilter,
  sideFilter,
  selectedTrade,
  deletingId,
  saving,
  onSearchChange,
  onResultFilterChange,
  onSideFilterChange,
  onSelectTrade,
  onEdit,
  onDelete,
  onAddTrade,
}: {
  trades: TradeDto[];
  search: string;
  resultFilter: "all" | "win" | "loss";
  sideFilter: "all" | TradeSide;
  selectedTrade: TradeDto | null;
  deletingId: string | null;
  saving: boolean;
  onSearchChange: (value: string) => void;
  onResultFilterChange: (value: "all" | "win" | "loss") => void;
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
  const wins = trades.filter((trade) => getTradePnl(trade) > 0).length;
  const winRate = trades.length > 0 ? wins / trades.length : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E6E8EF] bg-white px-4 py-3 lg:px-5">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search symbol, trade idea, or confluences"
          className="h-8 w-full rounded-md border border-[#E6E8EF] bg-[#F7F8FA] px-3 text-[12px] text-[#171923] outline-none placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10 sm:w-56"
        />

        <div className="flex gap-1">
          {(["all", "win", "loss"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onResultFilterChange(option)}
              className={`h-8 rounded-md border px-2.5 text-[11px] font-medium capitalize ${
                resultFilter === option
                  ? "border-[#6C5DD3] bg-[#6C5DD3]/10 text-[#6C5DD3]"
                  : "border-[#E6E8EF] bg-white text-[#697386]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(["all", "long", "short"] as const).map((option) => (
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
              {option === "all" ? "All" : getDirectionLabel(option)}
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
                    "Risk",
                    "R",
                    "P&L",
                    "Result",
                    "Trade Idea",
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
                        {formatMoney(trade.riskDollars)}
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] text-[#697386]">
                        {formatRatio(trade.rMultiple)}R
                      </td>
                      <td
                        className={`px-3 py-2 text-right text-[12px] font-semibold ${
                          pnl >= 0
                              ? "text-[#16A779]"
                              : "text-[#E25555]"
                        }`}
                      >
                        {formatMoney(pnl)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill trade={trade} />
                      </td>
                      <td className="max-w-48 px-3 py-2 text-[11px] text-[#697386]">
                        <div className="truncate">
                          {trade.journalEntry?.tradeIdea || "-"}
                        </div>
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
                    value: formatMoney(getTradePnl(selectedTrade)),
                    tone: getMoneyTone(getTradePnl(selectedTrade)),
                  },
                  {
                    label: "R Multiple",
                    value: `${formatRatio(selectedTrade.rMultiple)}R`,
                    tone: getMoneyTone(selectedTrade.rMultiple),
                  },
                  {
                    label: "Risk",
                    value: formatCompactMoney(selectedTrade.riskDollars),
                    tone: "neutral" as const,
                  },
                  {
                    label: "Playbook",
                    value: "Assigned",
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
                  ["Trade Date", formatDate(selectedTrade.openedAt)],
                  ["Risk", formatMoney(selectedTrade.riskDollars)],
                  ["R Multiple", `${formatRatio(selectedTrade.rMultiple)}R`],
                  ["P&L", formatMoney(getTradePnl(selectedTrade))],
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
                <p className="mb-1 text-[11px] font-medium text-[#697386]">Trade Idea</p>
                <div className="rounded-lg bg-[#F7F8FA] p-3 text-[12px] leading-5 text-[#171923]">
                  {selectedTrade.journalEntry?.tradeIdea || "No trade idea captured."}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-1 text-[11px] font-medium text-[#697386]">
                  Confluences
                </p>
                <div className="rounded-lg bg-[#F7F8FA] p-3 text-[12px] leading-5 text-[#171923]">
                  {selectedTrade.journalEntry?.confluences ||
                    "No confluences captured."}
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
  inlinePlaybookOpen,
  inlinePlaybookForm,
  inlinePlaybookSaving,
  inlinePlaybookError,
  error,
  trades,
  playbooks,
  onUpdateForm,
  onUpdateInlinePlaybookForm,
  onOpenInlinePlaybook,
  onCancelInlinePlaybook,
  onSubmitInlinePlaybook,
  onSubmit,
  onReset,
  onEdit,
}: {
  form: TradeFormState;
  editingTrade: TradeDto | null;
  saving: boolean;
  inlinePlaybookOpen: boolean;
  inlinePlaybookForm: PlaybookFormState;
  inlinePlaybookSaving: boolean;
  inlinePlaybookError: string | null;
  error: string | null;
  trades: TradeDto[];
  playbooks: PlaybookDto[];
  onUpdateForm: <Key extends keyof TradeFormState>(
    key: Key,
    value: TradeFormState[Key]
  ) => void;
  onUpdateInlinePlaybookForm: <Key extends keyof PlaybookFormState>(
    key: Key,
    value: PlaybookFormState[Key]
  ) => void;
  onOpenInlinePlaybook: () => void;
  onCancelInlinePlaybook: () => void;
  onSubmitInlinePlaybook: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onEdit: (trade: TradeDto) => void;
}) {
  const journaledTrades = trades
    .filter((trade) => trade.journalEntry?.tradeIdea)
    .slice(0, 5);

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
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="trade-playbook"
                className="text-sm font-medium text-[#4B5565]"
              >
                Playbook
              </label>
              <button
                type="button"
                onClick={onOpenInlinePlaybook}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#D7DAE2] bg-white px-2.5 text-xs font-semibold text-[#4B5565] transition hover:bg-[#F7F8FA] focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
                disabled={saving || inlinePlaybookSaving}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                New Playbook
              </button>
            </div>

            <select
              id="trade-playbook"
              value={form.playbookId}
              onChange={(event) => onUpdateForm("playbookId", event.target.value)}
              className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
              disabled={saving || inlinePlaybookSaving}
            >
              <option value="">
                {playbooks.length === 0
                  ? "Create a Playbook to continue"
                  : "Select a Playbook"}
              </option>
              {playbooks.map((playbook) => (
                <option key={playbook.id} value={playbook.id}>
                  {playbook.name}
                </option>
              ))}
            </select>

            {inlinePlaybookOpen ? (
              <div
                className="mt-1 grid gap-3 rounded-lg border border-[#D7DAE2] bg-[#FBFCFD] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#171923]">
                      New Playbook
                    </h3>
                    <p className="mt-1 text-[11px] font-normal text-[#697386]">
                      Created Playbooks are selected for this trade.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onCancelInlinePlaybook}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E6E8EF] bg-white text-[#697386] transition hover:bg-[#F7F8FA] focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
                    disabled={inlinePlaybookSaving}
                    aria-label="Cancel new Playbook"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                {inlinePlaybookError ? (
                  <p
                    role="alert"
                    className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-normal text-red-700"
                  >
                    {inlinePlaybookError}
                  </p>
                ) : null}

                <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
                  Name
                  <input
                    value={inlinePlaybookForm.name}
                    onChange={(event) =>
                      onUpdateInlinePlaybookForm("name", event.target.value)
                    }
                    className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
                    placeholder="Opening range breakout"
                    maxLength={80}
                    disabled={inlinePlaybookSaving}
                  />
                </label>

                <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
                  Description
                  <textarea
                    value={inlinePlaybookForm.description}
                    onChange={(event) =>
                      onUpdateInlinePlaybookForm(
                        "description",
                        event.target.value
                      )
                    }
                    className="min-h-20 resize-y rounded-md border border-[#E6E8EF] bg-white px-3 py-2 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
                    maxLength={500}
                    disabled={inlinePlaybookSaving}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
                    Color
                    <input
                      value={inlinePlaybookForm.color}
                      onChange={(event) =>
                        onUpdateInlinePlaybookForm("color", event.target.value)
                      }
                      className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
                      maxLength={7}
                      disabled={inlinePlaybookSaving}
                    />
                  </label>

                  <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
                    Rules
                    <textarea
                      value={inlinePlaybookForm.rules.join("\n")}
                      onChange={(event) =>
                        onUpdateInlinePlaybookForm("rules", event.target.value.split("\n"))
                      }
                      className="min-h-24 resize-y rounded-md border border-[#E6E8EF] bg-white px-3 py-2 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
                      placeholder="One Playbook Rule per line"
                      disabled={inlinePlaybookSaving}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={onSubmitInlinePlaybook}
                  disabled={inlinePlaybookSaving}
                  className="h-9 rounded-md bg-[#171923] px-3 text-sm font-semibold text-white transition hover:bg-[#2D3748] focus:outline-none focus:ring-2 focus:ring-[#171923] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#A0A7B8]"
                >
                  {inlinePlaybookSaving ? "Creating..." : "Create and select"}
                </button>
              </div>
            ) : null}
          </div>

          <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
            Symbol
            <input
              value={form.symbol}
              onChange={(event) => onUpdateForm("symbol", event.target.value)}
              className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
              placeholder="ES"
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
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
              Risk
              <input
                value={form.riskDollars}
                onChange={(event) => onUpdateForm("riskDollars", event.target.value)}
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
            R Multiple
            <input
              value={form.rMultiple}
              onChange={(event) => onUpdateForm("rMultiple", event.target.value)}
              className="h-10 rounded-md border border-[#E6E8EF] bg-white px-3 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
              inputMode="decimal"
              step="0.01"
              type="number"
              disabled={saving}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
            Trade Date
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
            Trade Idea
            <textarea
              value={form.tradeIdea}
              onChange={(event) => onUpdateForm("tradeIdea", event.target.value)}
              className="min-h-24 resize-y rounded-md border border-[#E6E8EF] bg-white px-3 py-2 text-sm text-[#171923] outline-none transition placeholder:text-[#A0A7B8] focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
              maxLength={5000}
              disabled={saving}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-[#4B5565]">
            Confluences
            <textarea
              value={form.confluences}
              onChange={(event) => onUpdateForm("confluences", event.target.value)}
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
            Trade ideas stored on completed trade records
          </p>
        </div>

        {journaledTrades.length === 0 ? (
          <EmptyState
            title="No journal entries yet"
            body="Add a completed trade to build your journal history."
          />
        ) : (
          <div className="grid gap-3">
            {journaledTrades.map((trade) => (
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
                  {trade.journalEntry?.tradeIdea}
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
  initialPlaybooks,
  userName,
  userEmail,
  nowIso,
}: TradeJournalProps) {
  const [trades, setTrades] = useState(() =>
    sortTrades(initialTrades.map(normalizeTrade))
  );
  const [playbooks, setPlaybooks] = useState(() =>
    sortPlaybooks(initialPlaybooks.map(normalizePlaybook))
  );
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const [analyticsRange, setAnalyticsRange] =
    useState<AnalyticsRangeKey>("all");
  const [form, setForm] = useState<TradeFormState>(() => createEmptyForm(nowIso));
  const [playbookForm, setPlaybookForm] = useState<PlaybookFormState>(() =>
    createEmptyPlaybookForm()
  );
  const [inlinePlaybookOpen, setInlinePlaybookOpen] = useState(false);
  const [inlinePlaybookForm, setInlinePlaybookForm] =
    useState<PlaybookFormState>(() => createEmptyPlaybookForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPlaybookId, setEditingPlaybookId] = useState<string | null>(null);
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [tradeSearch, setTradeSearch] = useState("");
  const [resultFilter, setResultFilter] =
    useState<"all" | "win" | "loss">("all");
  const [sideFilter, setSideFilter] = useState<"all" | TradeSide>("all");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playbookSaving, setPlaybookSaving] = useState(false);
  const [inlinePlaybookSaving, setInlinePlaybookSaving] = useState(false);
  const [deletingPlaybookId, setDeletingPlaybookId] = useState<string | null>(null);
  const [playbookError, setPlaybookError] = useState<string | null>(null);
  const [inlinePlaybookError, setInlinePlaybookError] = useState<string | null>(
    null
  );
  const currentDate = useMemo(() => new Date(nowIso), [nowIso]);
  const displayName = userName || userEmail || "Authenticated trader";

  const editingTrade = useMemo(
    () => trades.find((trade) => trade.id === editingId) ?? null,
    [editingId, trades]
  );
  const editingPlaybook = useMemo(
    () => playbooks.find((playbook) => playbook.id === editingPlaybookId) ?? null,
    [editingPlaybookId, playbooks]
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
        !(trade.journalEntry?.tradeIdea ?? "").toLowerCase().includes(query) &&
        !(trade.journalEntry?.confluences ?? "").toLowerCase().includes(query)
      ) {
        return false;
      }

      if (resultFilter === "win" && getTradePnl(trade) <= 0) {
        return false;
      }

      if (resultFilter === "loss" && getTradePnl(trade) >= 0) {
        return false;
      }

      if (sideFilter !== "all" && trade.side !== sideFilter) {
        return false;
      }

      return true;
    });
  }, [resultFilter, sideFilter, tradeSearch, trades]);

  function updateForm<Key extends keyof TradeFormState>(
    key: Key,
    value: TradeFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updatePlaybookForm<Key extends keyof PlaybookFormState>(
    key: Key,
    value: PlaybookFormState[Key]
  ) {
    setPlaybookForm((current) => ({ ...current, [key]: value }));
  }

  function updateInlinePlaybookForm<Key extends keyof PlaybookFormState>(
    key: Key,
    value: PlaybookFormState[Key]
  ) {
    setInlinePlaybookForm((current) => ({ ...current, [key]: value }));
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

  function resetPlaybookForm() {
    setEditingPlaybookId(null);
    setPlaybookForm(createEmptyPlaybookForm());
    setPlaybookError(null);
    setShowPlaybookModal(false);
  }

  function openInlinePlaybook() {
    setInlinePlaybookOpen(true);
    setInlinePlaybookError(null);
  }

  function resetInlinePlaybookForm() {
    setInlinePlaybookOpen(false);
    setInlinePlaybookForm(createEmptyPlaybookForm());
    setInlinePlaybookError(null);
  }

  function openTradeForPlaybook(playbookId: string) {
    resetForm();
    setForm((prev) => ({ ...prev, playbookId }));
    setActiveView("journal");
  }

  function openNewPlaybook() {
    resetPlaybookForm();
    setShowPlaybookModal(true);
    setActiveView("playbooks");
  }

  function startEditPlaybook(playbook: PlaybookDto) {
    setEditingPlaybookId(playbook.id);
    setPlaybookForm(playbookToForm(playbook));
    setPlaybookError(null);
    setShowPlaybookModal(true);
    setActiveView("playbooks");
  }

  async function handlePlaybookSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlaybookError(null);

    const result = buildPlaybookPayload(playbookForm);

    if (result.error) {
      setPlaybookError(result.error);
      return;
    }

    setPlaybookSaving(true);

    try {
      const response = await fetch(
        editingPlaybook ? `/api/playbooks/${editingPlaybook.id}` : "/api/playbooks",
        {
          method: editingPlaybook ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.payload),
        }
      );
      const body = await readApiBody(response);

      if (!response.ok || !body?.playbook) {
        throw new Error(
          formatApiError(body, "Unable to save this Playbook. Try again.")
        );
      }

      const nextPlaybook = normalizePlaybook(body.playbook);
      setPlaybooks((current) =>
        sortPlaybooks(
          editingPlaybook
            ? current.map((playbook) =>
                playbook.id === nextPlaybook.id ? nextPlaybook : playbook
              )
            : [...current, nextPlaybook]
        )
      );
      resetPlaybookForm();
    } catch (caught) {
      setPlaybookError(
        caught instanceof Error
          ? caught.message
          : "Unable to save this Playbook. Try again."
      );
    } finally {
      setPlaybookSaving(false);
    }
  }

  async function handleInlinePlaybookSubmit() {
    setInlinePlaybookError(null);

    const result = buildPlaybookPayload(inlinePlaybookForm);

    if (result.error) {
      setInlinePlaybookError(result.error);
      return;
    }

    setInlinePlaybookSaving(true);

    try {
      const response = await fetch("/api/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.payload),
      });
      const body = await readApiBody(response);

      if (!response.ok || !body?.playbook) {
        throw new Error(
          formatApiError(body, "Unable to create this Playbook. Try again.")
        );
      }

      const nextPlaybook = normalizePlaybook(body.playbook);
      setPlaybooks((current) => sortPlaybooks([...current, nextPlaybook]));
      setForm((current) => ({ ...current, playbookId: nextPlaybook.id }));
      resetInlinePlaybookForm();
    } catch (caught) {
      setInlinePlaybookError(
        caught instanceof Error
          ? caught.message
          : "Unable to create this Playbook. Try again."
      );
    } finally {
      setInlinePlaybookSaving(false);
    }
  }

  async function handleDeletePlaybook(playbook: PlaybookDto) {
    if (!window.confirm(`Delete ${playbook.name} Playbook?`)) {
      return;
    }

    setDeletingPlaybookId(playbook.id);
    setPlaybookError(null);

    try {
      const response = await fetch(`/api/playbooks/${playbook.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await readApiBody(response);
        throw new Error(
          formatApiError(body, "Unable to delete this Playbook. Try again.")
        );
      }

      setPlaybooks((current) =>
        current.filter((currentPlaybook) => currentPlaybook.id !== playbook.id)
      );

      if (editingPlaybookId === playbook.id) {
        resetPlaybookForm();
      }
    } catch (caught) {
      setPlaybookError(
        caught instanceof Error
          ? caught.message
          : "Unable to delete this Playbook. Try again."
      );
    } finally {
      setDeletingPlaybookId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = buildPayload(form);

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
            />
          ) : null}

          {activeView === "trades" ? (
            <TradeLogView
              trades={filteredTrades}
              search={tradeSearch}
              resultFilter={resultFilter}
              sideFilter={sideFilter}
              selectedTrade={selectedTrade}
              deletingId={deletingId}
              saving={saving}
              onSearchChange={setTradeSearch}
              onResultFilterChange={setResultFilter}
              onSideFilterChange={setSideFilter}
              onSelectTrade={(trade) => setSelectedTradeId(trade?.id ?? null)}
              onEdit={startEdit}
              onDelete={handleDelete}
              onAddTrade={openNewTrade}
            />
          ) : null}

          {activeView === "playbooks" ? (
            <PlaybooksView
              storedPlaybooks={playbooks}
              trades={trades}
              currentDate={currentDate}
              form={playbookForm}
              editingPlaybook={editingPlaybook}
              saving={playbookSaving}
              deletingId={deletingPlaybookId}
              error={playbookError}
              showModal={showPlaybookModal}
              onUpdateForm={updatePlaybookForm}
              onSubmit={handlePlaybookSubmit}
              onNew={openNewPlaybook}
              onEditPlaybook={startEditPlaybook}
              onDeletePlaybook={handleDeletePlaybook}
              onCancel={resetPlaybookForm}
              onEdit={startEdit}
              onLogTrade={openTradeForPlaybook}
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
              inlinePlaybookOpen={inlinePlaybookOpen}
              inlinePlaybookForm={inlinePlaybookForm}
              inlinePlaybookSaving={inlinePlaybookSaving}
              inlinePlaybookError={inlinePlaybookError}
              error={error}
              trades={trades}
              playbooks={playbooks}
              onUpdateForm={updateForm}
              onUpdateInlinePlaybookForm={updateInlinePlaybookForm}
              onOpenInlinePlaybook={openInlinePlaybook}
              onCancelInlinePlaybook={resetInlinePlaybookForm}
              onSubmitInlinePlaybook={handleInlinePlaybookSubmit}
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
