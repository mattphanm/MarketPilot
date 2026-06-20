"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  formatTradeDateInput,
  parseTradeDateInput,
} from "@/lib/trades/date-input";
import {
  addUtcMonths,
  buildCalendarMonth,
  createAnalyticsReport,
  getLatestTradeMonth,
  getTradePnl,
  startOfUtcMonth,
  type AnalyticsRangeKey,
  type AnalyticsReport,
  type EquityPoint,
} from "@/lib/analytics/report";
import type { TradeDto, TradePayload, TradeSide } from "@/lib/trades/types";

type TradeJournalProps = {
  initialTrades: TradeDto[];
};

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

const rangeOptions: Array<{ key: AnalyticsRangeKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "ytd", label: "YTD" },
];

function createEmptyForm(): TradeFormState {
  return {
    symbol: "",
    side: "buy",
    quantity: "",
    entry: "",
    exit: "",
    openedAt: formatTradeDateInput(new Date().toISOString()),
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

function getMoneyTone(value: number | null) {
  if (value === null || value === 0) {
    return "neutral";
  }

  return value > 0 ? "profit" : "loss";
}

function getMetricValueClass(tone: "neutral" | "profit" | "loss") {
  if (tone === "profit") {
    return "text-emerald-700";
  }

  if (tone === "loss") {
    return "text-red-700";
  }

  return "text-zinc-950";
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
    .map((point, index) => `${padding + index * xStep},${yFor(point.cumulativePnl)}`)
    .join(" ");

  return { width, height, linePoints, zeroY: yFor(0) };
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
    <div className="border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${getMetricValueClass(tone)}`}>
        {value}
      </p>
      <p className="mt-2 min-h-5 text-sm text-zinc-500">{detail}</p>
    </div>
  );
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

export default function TradeJournal({ initialTrades }: TradeJournalProps) {
  const [trades, setTrades] = useState(() =>
    sortTrades(initialTrades.map(normalizeTrade))
  );
  const [analyticsRange, setAnalyticsRange] =
    useState<AnalyticsRangeKey>("all");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    getLatestTradeMonth(initialTrades.map(normalizeTrade))
  );
  const [form, setForm] = useState<TradeFormState>(() => createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentDate = useMemo(() => new Date(), []);

  const editingTrade = useMemo(
    () => trades.find((trade) => trade.id === editingId) ?? null,
    [editingId, trades]
  );

  const analyticsReport = useMemo(
    () => createAnalyticsReport(trades, { range: analyticsRange, now: currentDate }),
    [analyticsRange, currentDate, trades]
  );
  const calendar = useMemo(
    () => buildCalendarMonth(trades, calendarMonth),
    [calendarMonth, trades]
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

  function updateForm<Key extends keyof TradeFormState>(
    key: Key,
    value: TradeFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyForm());
    setError(null);
  }

  function startEdit(trade: TradeDto) {
    setEditingId(trade.id);
    setForm(tradeToForm(trade));
    setError(null);
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
      resetForm();
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Reports
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-zinc-950">
              User analytics
            </h2>
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {rangeOptions.map((option) => {
              const selected = analyticsRange === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setAnalyticsRange(option.key)}
                  className={`h-9 min-w-16 border px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                    selected
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                  aria-pressed={selected}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            label="Net P&L"
            value={formatMoney(analyticsReport.netPnl)}
            detail={`${numberFormatter.format(
              analyticsReport.closedTrades
            )} closed / ${numberFormatter.format(analyticsReport.openTrades)} open`}
            tone={getMoneyTone(analyticsReport.netPnl)}
          />
          <MetricCard
            label="Win rate"
            value={formatPercent(analyticsReport.winRate)}
            detail={`${numberFormatter.format(
              analyticsReport.winningTrades
            )} wins, ${numberFormatter.format(analyticsReport.losingTrades)} losses`}
          />
          <MetricCard
            label="Profit factor"
            value={formatRatio(analyticsReport.profitFactor)}
            detail={`${formatMoney(analyticsReport.grossProfit)} gross win`}
          />
          <MetricCard
            label="Avg win/loss"
            value={formatRatio(analyticsReport.averageWinLoss)}
            detail={`${formatMoney(analyticsReport.averageWin)} / ${formatMoney(
              Math.abs(analyticsReport.averageLoss)
            )}`}
          />
          <MetricCard
            label="Expectancy"
            value={formatMoney(analyticsReport.expectancy)}
            detail="Per closed trade"
            tone={getMoneyTone(analyticsReport.expectancy)}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <section className="border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-950">
                  Daily net cumulative P&amp;L
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {numberFormatter.format(analyticsReport.activeDays)} active days
                </p>
              </div>
              <p
                className={`text-sm font-semibold ${getMetricValueClass(
                  getMoneyTone(analyticsReport.netPnl)
                )}`}
              >
                {formatMoney(analyticsReport.netPnl)}
              </p>
            </div>

            <div className="mt-4 h-64 overflow-hidden border border-zinc-100 bg-zinc-50">
              {analyticsReport.equityCurve.length === 0 ? (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-500">
                  No closed trades in this period.
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${equityChart.width} ${equityChart.height}`}
                  className="h-full w-full"
                  role="img"
                  aria-label="Daily cumulative P&L chart"
                >
                  <line
                    x1="0"
                    x2={equityChart.width}
                    y1={equityChart.zeroY}
                    y2={equityChart.zeroY}
                    stroke="#d4d4d8"
                    strokeWidth="1"
                  />
                  <polyline
                    points={equityChart.linePoints}
                    fill="none"
                    stroke={analyticsReport.netPnl >= 0 ? "#047857" : "#b91c1c"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                  />
                </svg>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Best day
                </p>
                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  {formatOptionalMoney(analyticsReport.bestDayPnl)}
                </p>
              </div>
              <div className="border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Worst day
                </p>
                <p className="mt-2 text-sm font-semibold text-red-700">
                  {formatOptionalMoney(analyticsReport.worstDayPnl)}
                </p>
              </div>
              <div className="border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Symbols
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-950">
                  {numberFormatter.format(analyticsReport.symbolsTraded)}
                </p>
              </div>
            </div>
          </section>

          <section className="border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-950">
                  MarketPilot score
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {numberFormatter.format(analyticsReport.closedTrades)} closed trades
                </p>
              </div>
              <p className="text-2xl font-semibold text-zinc-950">
                {ratioFormatter.format(score.score)}
              </p>
            </div>

            <div className="mt-4 flex justify-center">
              <svg
                viewBox="0 0 100 100"
                className="h-48 w-48"
                role="img"
                aria-label="MarketPilot score radar"
              >
                <polygon
                  points="50,8 89.9,37 74.7,84 25.3,84 10.1,37"
                  fill="#f4f4f5"
                  stroke="#d4d4d8"
                  strokeWidth="0.8"
                />
                <polygon
                  points="50,22 76.6,41.3 66.5,72.7 33.5,72.7 23.4,41.3"
                  fill="none"
                  stroke="#d4d4d8"
                  strokeWidth="0.8"
                />
                <polygon
                  points={radarPoints}
                  fill="rgba(16, 185, 129, 0.22)"
                  stroke="#047857"
                  strokeWidth="1.6"
                />
              </svg>
            </div>

            <div className="mt-4 grid gap-3">
              {score.metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs text-zinc-500">
                    <span>{metric.label}</span>
                    <span>{ratioFormatter.format(metric.value)}</span>
                  </div>
                  <div className="h-2 bg-zinc-100">
                    <div
                      className="h-2 bg-emerald-600"
                      style={{ width: `${clampScore(metric.value)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="mt-5 border border-zinc-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">Calendar</h2>
            <p className="mt-1 text-sm text-zinc-500">{calendar.monthLabel}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setCalendarMonth((current) => addUtcMonths(current, -1))
              }
              className="h-9 border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCalendarMonth(startOfUtcMonth(currentDate))}
              className="h-9 border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() =>
                setCalendarMonth((current) => addUtcMonths(current, 1))
              }
              className="h-9 border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
                className="border border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500"
              >
                {day}
              </div>
            ))}
            <div className="border border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
              Week
            </div>

            {calendar.weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="contents">
                {week.days.map((day) => {
                  const dayTone =
                    day.pnl > 0 && day.isCurrentMonth
                      ? "border-emerald-200 bg-emerald-50"
                      : day.pnl < 0 && day.isCurrentMonth
                        ? "border-red-200 bg-red-50"
                        : day.isCurrentMonth
                          ? "border-zinc-200 bg-white"
                          : "border-zinc-100 bg-zinc-50 text-zinc-400";

                  return (
                    <div
                      key={day.dateKey}
                      className={`flex min-h-28 flex-col border p-3 ${dayTone}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium">
                          {day.dayNumber}
                        </span>
                        {day.closedTrades > 0 ? (
                          <span className="text-xs text-zinc-500">
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
                          <p className="mt-1 text-xs text-zinc-500">
                            {numberFormatter.format(day.trades)}{" "}
                            {day.trades === 1 ? "trade" : "trades"}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                <div
                  className={`flex min-h-28 flex-col justify-between border p-3 ${
                    week.summary.pnl > 0
                      ? "border-emerald-200 bg-emerald-50"
                      : week.summary.pnl < 0
                        ? "border-red-200 bg-red-50"
                        : "border-zinc-200 bg-zinc-50"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
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
                      <p className="mt-1 text-xs text-zinc-500">
                        {numberFormatter.format(week.summary.trades)} trades
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {numberFormatter.format(week.summary.activeDays)} active days
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400">No activity</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="border border-zinc-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">
                {editingTrade ? "Edit trade" : "New trade"}
              </h2>
              {editingTrade ? (
                <p className="mt-1 text-xs text-zinc-500">
                  {editingTrade.symbol} opened {formatDate(editingTrade.openedAt)}
                </p>
              ) : null}
            </div>
            {editingTrade ? (
              <button
                type="button"
                onClick={resetForm}
                className="h-8 border border-zinc-300 px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                Cancel
              </button>
            ) : null}
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </p>
          ) : null}

          <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Symbol
              <input
                value={form.symbol}
                onChange={(event) => updateForm("symbol", event.target.value)}
                className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="AAPL"
                maxLength={20}
                disabled={saving}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Side
                <select
                  value={form.side}
                  onChange={(event) =>
                    updateForm("side", event.target.value as TradeSide)
                  }
                  className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  disabled={saving}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </label>

              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Quantity
                <input
                  value={form.quantity}
                  onChange={(event) =>
                    updateForm("quantity", event.target.value)
                  }
                  className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  type="number"
                  disabled={saving}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Entry
                <input
                  value={form.entry}
                  onChange={(event) => updateForm("entry", event.target.value)}
                  className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  type="number"
                  disabled={saving}
                />
              </label>

              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Exit
                <input
                  value={form.exit}
                  onChange={(event) => updateForm("exit", event.target.value)}
                  className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  type="number"
                  disabled={saving}
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Opened
              <input
                value={form.openedAt}
                onChange={(event) => updateForm("openedAt", event.target.value)}
                className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="2026-06-20 14:30"
                type="text"
                disabled={saving}
              />
              <span className="text-xs font-normal text-zinc-500">
                Use 24-hour time, for example 6/20 14:30 or 1430.
              </span>
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Closed
              <input
                value={form.closedAt}
                onChange={(event) => updateForm("closedAt", event.target.value)}
                className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="2026-06-20 15:45"
                type="text"
                disabled={saving}
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Notes
              <textarea
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                className="min-h-24 resize-y border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                maxLength={5000}
                disabled={saving}
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="mt-1 h-10 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {saving
                ? "Saving..."
                : editingTrade
                  ? "Save changes"
                  : "Create trade"}
            </button>
          </form>
        </section>

        <section className="min-w-0 border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-950">
              Trade history
            </h2>
            <p className="text-sm text-zinc-500">
              {numberFormatter.format(trades.length)} records
            </p>
          </div>

          {trades.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-zinc-800">No trades yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                Add your first trade to start the journal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
                  <tr>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Symbol
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Qty
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Entry
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Exit
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Opened
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Closed
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Notes
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 text-right font-semibold">
                      P&amp;L
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => {
                    const pnl = getTradePnl(trade);
                    const deleting = deletingId === trade.id;

                    return (
                      <tr
                        key={trade.id}
                        className={`border-b border-zinc-100 transition ${
                          deleting ? "opacity-50" : "hover:bg-zinc-50"
                        }`}
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-zinc-950">
                            {trade.symbol}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                            {trade.side}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-zinc-700">
                          {numberFormatter.format(trade.quantity)}
                        </td>
                        <td className="px-4 py-3 align-top text-zinc-700">
                          {formatMoney(trade.entry)}
                        </td>
                        <td className="px-4 py-3 align-top text-zinc-700">
                          {trade.exit === null ? "Open" : formatMoney(trade.exit)}
                        </td>
                        <td className="px-4 py-3 align-top text-zinc-700">
                          {formatDate(trade.openedAt)}
                        </td>
                        <td className="px-4 py-3 align-top text-zinc-700">
                          {formatDate(trade.closedAt)}
                        </td>
                        <td className="max-w-56 px-4 py-3 align-top text-zinc-700">
                          <div className="truncate">
                            {trade.notes ? (
                              trade.notes
                            ) : (
                              <span className="text-zinc-400">None</span>
                            )}
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 text-right align-top font-semibold ${
                            pnl === null
                              ? "text-zinc-400"
                              : pnl >= 0
                                ? "text-emerald-700"
                                : "text-red-700"
                          }`}
                        >
                          {pnl === null ? "Open" : formatMoney(pnl)}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(trade)}
                              disabled={saving || deleting}
                              className="h-8 border border-zinc-300 px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(trade)}
                              disabled={saving || deleting}
                              className="h-8 border border-red-200 px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
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
    </div>
  );
}
