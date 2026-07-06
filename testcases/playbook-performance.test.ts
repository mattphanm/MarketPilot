import { describe, expect, it } from "vitest";
import {
  buildPlaybookPerformance,
  type PlaybookPerformanceTrade,
} from "../lib/playbooks/performance";
import { filterAnalyticsTradesByEntryTime } from "../lib/analytics/report";
import type { PlaybookDto } from "../lib/playbooks/types";

const baseDate = "2026-06-01T14:00:00.000Z";

function createPlaybook(overrides: Partial<PlaybookDto> = {}): PlaybookDto {
  return {
    id: "breakout",
    name: "Opening Range Breakout",
    description: "Momentum setup after the opening range.",
    color: "#6C5DD3",
    rules: ["Break range", "Hold above level"],
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  };
}

function createTrade(
  overrides: Partial<PlaybookPerformanceTrade> = {}
): PlaybookPerformanceTrade {
  return {
    id: "trade-1",
    playbookId: "breakout",
    symbol: "ES",
    side: "long",
    riskDollars: 100,
    rMultiple: 1,
    openedAt: baseDate,
    createdAt: baseDate,
    updatedAt: baseDate,
    journalEntry: null,
    ...overrides,
  };
}

describe("playbook performance", () => {
  it("derives performance stats from trades assigned to each playbook", () => {
    const [performance] = buildPlaybookPerformance(
      [createPlaybook()],
      [
        createTrade({ id: "win", symbol: "NQ", riskDollars: 100, rMultiple: 2 }),
        createTrade({ id: "loss", symbol: "ES", riskDollars: 50, rMultiple: -1 }),
        createTrade({ id: "other", playbookId: "pullback", riskDollars: 100, rMultiple: 5 }),
      ]
    );

    expect(performance.totalTrades).toBe(2);
    expect(performance.winRate).toBe(0.5);
    expect(performance.averagePnl).toBe(75);
    expect(performance.averageRMultiple).toBe(0.5);
    expect(performance.bestTrade?.id).toBe("win");
    expect(performance.bestTradePnl).toBe(200);
    expect(performance.worstTrade?.id).toBe("loss");
    expect(performance.worstTradePnl).toBe(-50);
  });

  it("returns empty performance states for playbooks without assigned trades", () => {
    const [performance] = buildPlaybookPerformance([createPlaybook()], []);

    expect(performance.totalTrades).toBe(0);
    expect(performance.trades).toEqual([]);
    expect(performance.winRate).toBeNull();
    expect(performance.averagePnl).toBeNull();
    expect(performance.averageRMultiple).toBeNull();
    expect(performance.bestTrade).toBeNull();
    expect(performance.bestTradePnl).toBeNull();
    expect(performance.worstTrade).toBeNull();
    expect(performance.worstTradePnl).toBeNull();
  });

  it("updates derived metrics when trade values or assignments change", () => {
    const playbook = createPlaybook();
    const initial = buildPlaybookPerformance(
      [playbook],
      [createTrade({ id: "trade-1", riskDollars: 100, rMultiple: 1 })]
    )[0];
    const edited = buildPlaybookPerformance(
      [playbook],
      [createTrade({ id: "trade-1", riskDollars: 100, rMultiple: -2 })]
    )[0];
    const reassigned = buildPlaybookPerformance(
      [playbook],
      [createTrade({ id: "trade-1", playbookId: "different", riskDollars: 100, rMultiple: -2 })]
    )[0];

    expect(initial.averagePnl).toBe(100);
    expect(initial.winRate).toBe(1);
    expect(edited.averagePnl).toBe(-200);
    expect(edited.winRate).toBe(0);
    expect(reassigned.totalTrades).toBe(0);
    expect(reassigned.averagePnl).toBeNull();
  });

  it("can filter trades by userId for authenticated ownership scope", () => {
    const [performance] = buildPlaybookPerformance(
      [createPlaybook()],
      [
        createTrade({ id: "owned", userId: "user-1", riskDollars: 100, rMultiple: 1 }),
        createTrade({ id: "foreign", userId: "user-2", riskDollars: 100, rMultiple: 5 }),
      ],
      { userId: "user-1" }
    );

    expect(performance.trades.map((trade) => trade.id)).toEqual(["owned"]);
    expect(performance.totalTrades).toBe(1);
    expect(performance.averagePnl).toBe(100);
  });

  it("derives performance from entry-time filtered trades while preserving playbook definitions", () => {
    const playbooks = [
      createPlaybook(),
      createPlaybook({
        id: "reversal",
        name: "Failed Break Reversal",
        description: "Fade failed continuation.",
      }),
    ];
    const filteredTrades = filterAnalyticsTradesByEntryTime(
      [
        createTrade({
          id: "outside-win",
          riskDollars: 100,
          rMultiple: 3,
          openedAt: "2026-05-31T14:00:00.000Z",
        }),
        createTrade({
          id: "inside-loss",
          riskDollars: 50,
          rMultiple: -1,
          openedAt: "2026-06-04T14:00:00.000Z",
        }),
      ],
      {
        start: new Date("2026-06-01T00:00:00.000Z"),
        end: new Date("2026-06-10T00:00:00.000Z"),
      }
    );

    const performance = buildPlaybookPerformance(playbooks, filteredTrades);

    expect(performance).toMatchObject([
      {
        playbook: { id: "breakout", name: "Opening Range Breakout" },
        totalTrades: 1,
        winRate: 0,
        averagePnl: -50,
        averageRMultiple: -1,
        bestTrade: { id: "inside-loss" },
        bestTradePnl: -50,
        worstTrade: { id: "inside-loss" },
        worstTradePnl: -50,
      },
      {
        playbook: { id: "reversal", name: "Failed Break Reversal" },
        totalTrades: 0,
        winRate: null,
        averagePnl: null,
        averageRMultiple: null,
        bestTrade: null,
        bestTradePnl: null,
        worstTrade: null,
        worstTradePnl: null,
      },
    ]);
  });
});
