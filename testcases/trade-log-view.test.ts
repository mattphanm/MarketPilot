import { describe, expect, it } from "vitest";
import {
  filterAndSortTradeLogRows,
  getTradeStatusLabel,
  sortTradeLogRows,
  type TradeLogQuery,
} from "../lib/trades/log-view";
import type { TradeDto, TradeSide } from "../lib/trades/types";

function trade(
  id: string,
  overrides: Partial<TradeDto> & {
    symbol: string;
    side: TradeSide;
    riskDollars: number;
    rMultiple: number;
    openedAt: string;
  }
): TradeDto {
  return {
    id,
    playbookId: "playbook-1",
    createdAt: `2026-06-20T00:00:0${id}.000Z`,
    updatedAt: `2026-06-20T00:00:0${id}.000Z`,
    journalEntry: {
      id: `journal-${id}`,
      tradeId: id,
      tradeIdea: "",
      confluences: "",
      createdAt: `2026-06-20T00:00:0${id}.000Z`,
      updatedAt: `2026-06-20T00:00:0${id}.000Z`,
    },
    ...overrides,
  };
}

const trades = [
  trade("1", {
    symbol: "ES",
    side: "long",
    riskDollars: 500,
    rMultiple: 1.25,
    openedAt: "2026-06-18T14:30:00.000Z",
    journalEntry: {
      id: "journal-1",
      tradeId: "1",
      tradeIdea: "Opening range continuation",
      confluences: "VWAP hold",
      createdAt: "2026-06-20T00:00:01.000Z",
      updatedAt: "2026-06-20T00:00:01.000Z",
    },
  }),
  trade("2", {
    symbol: "NQ",
    side: "short",
    riskDollars: 300,
    rMultiple: -0.75,
    openedAt: "2026-06-19T14:30:00.000Z",
    journalEntry: {
      id: "journal-2",
      tradeId: "2",
      tradeIdea: "Failed breakout",
      confluences: "Supply rejection",
      createdAt: "2026-06-20T00:00:02.000Z",
      updatedAt: "2026-06-20T00:00:02.000Z",
    },
  }),
  trade("3", {
    symbol: "YM",
    side: "long",
    riskDollars: 200,
    rMultiple: 0,
    openedAt: "2026-06-17T14:30:00.000Z",
    journalEntry: null,
  }),
];

function query(overrides: Partial<TradeLogQuery> = {}): TradeLogQuery {
  return {
    search: "",
    resultFilter: "all",
    sideFilter: "all",
    sort: { key: "openedAt", direction: "desc" },
    ...overrides,
  };
}

describe("Trade Log query helpers", () => {
  it("searches by symbol, trade idea, and confluences", () => {
    expect(
      filterAndSortTradeLogRows(trades, query({ search: "nq" })).map(
        (row) => row.id
      )
    ).toEqual(["2"]);

    expect(
      filterAndSortTradeLogRows(trades, query({ search: "opening" })).map(
        (row) => row.id
      )
    ).toEqual(["1"]);

    expect(
      filterAndSortTradeLogRows(trades, query({ search: "supply" })).map(
        (row) => row.id
      )
    ).toEqual(["2"]);
  });

  it("filters rows by direction and result", () => {
    expect(
      filterAndSortTradeLogRows(
        trades,
        query({ sideFilter: "long", resultFilter: "win" })
      ).map((row) => row.id)
    ).toEqual(["1"]);

    expect(
      filterAndSortTradeLogRows(
        trades,
        query({ sideFilter: "short", resultFilter: "loss" })
      ).map((row) => row.id)
    ).toEqual(["2"]);
  });

  it("ignores entry-time range fields so Trade Log rows are not analytics-filtered", () => {
    const queryWithAnalyticsRange = {
      ...query(),
      range: "30d",
      start: new Date("2026-06-19T00:00:00.000Z"),
      end: new Date("2026-06-19T23:59:59.999Z"),
      now: new Date("2026-06-20T00:00:00.000Z"),
    };

    expect(
      filterAndSortTradeLogRows(trades, queryWithAnalyticsRange).map(
        (row) => row.id
      )
    ).toEqual(["2", "1", "3"]);
  });

  it("sorts stable visible values in both directions", () => {
    expect(
      sortTradeLogRows(trades, { key: "pnl", direction: "asc" }).map(
        (row) => row.id
      )
    ).toEqual(["2", "3", "1"]);

    expect(
      sortTradeLogRows(trades, { key: "symbol", direction: "desc" }).map(
        (row) => row.id
      )
    ).toEqual(["3", "2", "1"]);
  });

  it("derives result labels from completed trade P&L", () => {
    expect(trades.map(getTradeStatusLabel)).toEqual(["WIN", "LOSS", "BE"]);
  });
});
