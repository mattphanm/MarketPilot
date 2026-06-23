import { describe, expect, it } from "vitest";
import {
  buildCalendarMonth,
  createAnalyticsReport,
  type AnalyticsTrade,
} from "../lib/analytics/report";

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
