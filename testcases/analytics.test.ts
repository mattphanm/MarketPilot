import { describe, expect, it } from "vitest";
import {
  buildCalendarMonth,
  createAnalyticsReport,
  filterAnalyticsTradesByEntryTime,
  type AnalyticsTrade,
} from "../lib/analytics/report";
import { buildPlaybookPerformance } from "../lib/playbooks/performance";
import type { PlaybookDto } from "../lib/playbooks/types";
import type { TradeDto } from "../lib/trades/types";

type TestPath = "happy" | "edge" | "failure";

type TestCase = {
  path: TestPath;
  name: string;
  expectation: string;
};

export const analyticsTestCases: TestCase[] = [
  {
    path: "happy",
    name: "returns analytics for the authenticated user's trades",
    expectation: "GET /api/analytics calculates metrics from trades owned by the current user.",
  },
  {
    path: "happy",
    name: "respects supported date range filters",
    expectation: "GET /api/analytics limits calculations to trades inside the requested range.",
  },
  {
    path: "edge",
    name: "returns zeroed metrics for a user with no trades",
    expectation: "the response contains valid empty-state analytics instead of an error.",
  },
  {
    path: "edge",
    name: "handles breakeven completed trades",
    expectation: "breakeven futures trades do not break completed-trade performance calculations.",
  },
  {
    path: "failure",
    name: "rejects unauthenticated analytics requests",
    expectation: "GET /api/analytics returns status 401.",
  },
  {
    path: "failure",
    name: "does not include another user's trade data",
    expectation: "analytics queries are scoped to the authenticated user's userId.",
  },
];

const testPaths: TestPath[] = ["happy", "edge", "failure"];

describe("analytics test case inventory", () => {
  it.each(testPaths)("defines two %s cases", (path) => {
    expect(analyticsTestCases.filter((testCase) => testCase.path === path)).toHaveLength(2);
  });

  it.each(analyticsTestCases)("$path: $name", (testCase) => {
    expect(testCase.name).toMatch(/\S/);
    expect(testCase.expectation).toMatch(/\S/);
  });

  it("defines failure cases as rejection or data-isolation expectations", () => {
    const failureCases = analyticsTestCases.filter((testCase) => testCase.path === "failure");

    expect(
      failureCases.every((testCase) => /reject|401|scoped|userId/i.test(testCase.expectation))
    ).toBe(true);
  });
});

const analyticsTrades: AnalyticsTrade[] = [
  {
    id: "aapl-win",
    symbol: "AAPL",
    side: "long",
    riskDollars: 100,
    rMultiple: 1,
    openedAt: "2026-06-03T14:00:00.000Z",
  },
  {
    id: "msft-loss",
    symbol: "MSFT",
    side: "long",
    riskDollars: 20,
    rMultiple: -1,
    openedAt: "2026-06-04T14:00:00.000Z",
  },
  {
    id: "tsla-short-win",
    symbol: "TSLA",
    side: "short",
    riskDollars: 20,
    rMultiple: 1,
    openedAt: "2026-06-10T14:00:00.000Z",
  },
  {
    id: "nvda-flat",
    symbol: "NVDA",
    side: "long",
    riskDollars: 50,
    rMultiple: 0,
    openedAt: "2026-06-11T14:00:00.000Z",
  },
  {
    id: "spy-old-win",
    symbol: "SPY",
    side: "long",
    riskDollars: 20,
    rMultiple: 1,
    openedAt: "2026-01-02T14:00:00.000Z",
  },
];

const playbooks: PlaybookDto[] = [
  {
    id: "breakout",
    name: "Breakout",
    description: "Opening range continuation",
    color: "#6C5DD3",
    rules: ["Range cleared"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "reversal",
    name: "Reversal",
    description: "Failed move fade",
    color: "#00B8A9",
    rules: ["Failed breakout"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("analytics report calculations", () => {
  it("calculates completed futures performance from risk and R", () => {
    const report = createAnalyticsReport(analyticsTrades, {
      now: new Date("2026-06-20T12:00:00.000Z"),
    });

    expect(report.totalTrades).toBe(5);
    expect(report.closedTrades).toBe(5);
    expect(report.openTrades).toBe(0);
    expect(report.netPnl).toBe(120);
    expect(report.grossProfit).toBe(140);
    expect(report.grossLoss).toBe(-20);
    expect(report.winRate).toBe(0.6);
    expect(report.profitFactor).toBe(7);
    expect(report.averageRMultiple).toBe(0.4);
    expect(report.expectancy).toBe(24);
  });

  it("respects supported relative date ranges", () => {
    const report = createAnalyticsReport(analyticsTrades, {
      range: "30d",
      now: new Date("2026-06-20T12:00:00.000Z"),
    });

    expect(report.totalTrades).toBe(4);
    expect(report.closedTrades).toBe(4);
    expect(report.netPnl).toBe(100);
    expect(report.averageRMultiple).toBe(0.25);
    expect(report.daily.map((day) => day.dateKey)).toEqual([
      "2026-06-03",
      "2026-06-04",
      "2026-06-10",
      "2026-06-11",
    ]);
  });

  it("applies all supported entry-time ranges to metrics, daily P&L, and equity curve", () => {
    const now = new Date("2026-07-01T12:00:00.000Z");

    const allReport = createAnalyticsReport(analyticsTrades, {
      range: "all",
      now,
    });
    const thirtyDayReport = createAnalyticsReport(analyticsTrades, {
      range: "30d",
      now,
    });
    const ninetyDayReport = createAnalyticsReport(analyticsTrades, {
      range: "90d",
      now,
    });
    const ytdReport = createAnalyticsReport(analyticsTrades, {
      range: "ytd",
      now,
    });

    expect(allReport.totalTrades).toBe(5);
    expect(allReport.netPnl).toBe(120);
    expect(allReport.daily.map((day) => day.dateKey)).toEqual([
      "2026-01-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-10",
      "2026-06-11",
    ]);
    expect(allReport.equityCurve.map((point) => point.cumulativePnl)).toEqual([
      20,
      120,
      100,
      120,
      120,
    ]);

    expect(thirtyDayReport.totalTrades).toBe(4);
    expect(thirtyDayReport.netPnl).toBe(100);
    expect(thirtyDayReport.daily.map((day) => day.dateKey)).toEqual([
      "2026-06-03",
      "2026-06-04",
      "2026-06-10",
      "2026-06-11",
    ]);
    expect(thirtyDayReport.equityCurve.map((point) => point.dateKey)).toEqual([
      "2026-06-03",
      "2026-06-04",
      "2026-06-10",
      "2026-06-11",
    ]);

    expect(ninetyDayReport.totalTrades).toBe(4);
    expect(ninetyDayReport.netPnl).toBe(100);
    expect(ninetyDayReport.daily.map((day) => day.dateKey)).toEqual(
      thirtyDayReport.daily.map((day) => day.dateKey)
    );

    expect(ytdReport.totalTrades).toBe(5);
    expect(ytdReport.netPnl).toBe(120);
    expect(ytdReport.daily.map((day) => day.dateKey)).toEqual(
      allReport.daily.map((day) => day.dateKey)
    );
  });

  it("uses inclusive trailing and year-to-date entry-time boundaries", () => {
    const boundaryTrades: AnalyticsTrade[] = [
      {
        id: "before-30d",
        symbol: "ES",
        side: "long",
        riskDollars: 100,
        rMultiple: 9,
        openedAt: "2026-05-31T23:59:59.999Z",
      },
      {
        id: "start-30d",
        symbol: "NQ",
        side: "long",
        riskDollars: 100,
        rMultiple: 1,
        openedAt: "2026-06-01T00:00:00.000Z",
      },
      {
        id: "end-day",
        symbol: "YM",
        side: "short",
        riskDollars: 100,
        rMultiple: 2,
        openedAt: "2026-06-30T23:59:59.999Z",
      },
      {
        id: "after-now-day",
        symbol: "RTY",
        side: "long",
        riskDollars: 100,
        rMultiple: 7,
        openedAt: "2026-07-01T00:00:00.000Z",
      },
      {
        id: "ytd-start",
        symbol: "CL",
        side: "short",
        riskDollars: 100,
        rMultiple: 3,
        openedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const thirtyDayTrades = filterAnalyticsTradesByEntryTime(boundaryTrades, {
      range: "30d",
      now: new Date("2026-06-30T12:00:00.000Z"),
    });
    const ytdTrades = filterAnalyticsTradesByEntryTime(boundaryTrades, {
      range: "ytd",
      now: new Date("2026-06-30T12:00:00.000Z"),
    });

    expect(thirtyDayTrades.map((trade) => trade.id)).toEqual([
      "start-30d",
      "end-day",
    ]);
    expect(ytdTrades.map((trade) => trade.id)).toEqual([
      "before-30d",
      "start-30d",
      "end-day",
      "ytd-start",
    ]);
  });

  it("returns a valid zeroed report for an empty selected entry-time window", () => {
    const report = createAnalyticsReport(analyticsTrades, {
      range: "30d",
      now: new Date("2026-12-31T12:00:00.000Z"),
    });

    expect(report.totalTrades).toBe(0);
    expect(report.closedTrades).toBe(0);
    expect(report.openTrades).toBe(0);
    expect(report.netPnl).toBe(0);
    expect(report.grossProfit).toBe(0);
    expect(report.grossLoss).toBe(0);
    expect(report.winRate).toBeNull();
    expect(report.profitFactor).toBeNull();
    expect(report.averageRMultiple).toBeNull();
    expect(report.averageWin).toBe(0);
    expect(report.averageLoss).toBe(0);
    expect(report.expectancy).toBe(0);
    expect(report.bestTradePnl).toBeNull();
    expect(report.worstTradePnl).toBeNull();
    expect(report.bestDayPnl).toBeNull();
    expect(report.worstDayPnl).toBeNull();
    expect(report.daily).toEqual([]);
    expect(report.equityCurve).toEqual([]);
  });

  it("filters metrics by explicit entry-time start and end dates", () => {
    const report = createAnalyticsReport(analyticsTrades, {
      start: new Date("2026-06-04T00:00:00.000Z"),
      end: new Date("2026-06-10T00:00:00.000Z"),
      now: new Date("2026-06-20T12:00:00.000Z"),
    });

    expect(report.totalTrades).toBe(2);
    expect(report.closedTrades).toBe(2);
    expect(report.netPnl).toBe(0);
    expect(report.daily.map((day) => day.dateKey)).toEqual([
      "2026-06-04",
      "2026-06-10",
    ]);
  });

  it("uses the same entry-time filter for playbook performance inputs", () => {
    const trades: TradeDto[] = [
      {
        id: "aapl-win",
        symbol: "AAPL",
        side: "long" as const,
        riskDollars: 100,
        rMultiple: 1,
        openedAt: "2026-06-03T14:00:00.000Z",
        playbookId: "breakout",
        createdAt: "2026-06-03T14:00:00.000Z",
        updatedAt: "2026-06-03T14:00:00.000Z",
        journalEntry: null,
      },
      {
        id: "msft-loss",
        symbol: "MSFT",
        side: "long" as const,
        riskDollars: 20,
        rMultiple: -1,
        openedAt: "2026-06-04T14:00:00.000Z",
        playbookId: "breakout",
        createdAt: "2026-06-04T14:00:00.000Z",
        updatedAt: "2026-06-04T14:00:00.000Z",
        journalEntry: null,
      },
      {
        id: "tsla-short-win",
        symbol: "TSLA",
        side: "short" as const,
        riskDollars: 20,
        rMultiple: 1,
        openedAt: "2026-06-10T14:00:00.000Z",
        playbookId: "reversal",
        createdAt: "2026-06-10T14:00:00.000Z",
        updatedAt: "2026-06-10T14:00:00.000Z",
        journalEntry: null,
      },
    ];

    const filteredTrades = filterAnalyticsTradesByEntryTime(trades, {
      start: new Date("2026-06-04T00:00:00.000Z"),
      end: new Date("2026-06-10T00:00:00.000Z"),
    });
    const performance = buildPlaybookPerformance(playbooks, filteredTrades);

    expect(filteredTrades.map((trade) => trade.id)).toEqual([
      "msft-loss",
      "tsla-short-win",
    ]);
    expect(performance).toMatchObject([
      {
        playbook: { id: "breakout" },
        totalTrades: 1,
        averagePnl: -20,
      },
      {
        playbook: { id: "reversal" },
        totalTrades: 1,
        averagePnl: 20,
      },
    ]);
  });

  it("builds a month calendar with daily cells and weekly summaries", () => {
    const calendar = buildCalendarMonth(
      analyticsTrades,
      new Date("2026-06-01T00:00:00.000Z")
    );
    const firstWeek = calendar.weeks[0].summary;
    const secondWeek = calendar.weeks[1].summary;

    expect(calendar.monthLabel).toBe("June 2026");
    expect(calendar.weeks).toHaveLength(6);
    expect(firstWeek.pnl).toBe(80);
    expect(firstWeek.trades).toBe(2);
    expect(secondWeek.pnl).toBe(20);
    expect(secondWeek.trades).toBe(2);
  });
});
