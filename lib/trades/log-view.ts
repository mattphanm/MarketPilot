import { getTradePnl } from "../analytics/report";
import type { TradeDto, TradeSide } from "./types";

export type TradeSortKey =
  | "openedAt"
  | "symbol"
  | "side"
  | "riskDollars"
  | "rMultiple"
  | "pnl"
  | "result"
  | "tradeIdea";

export type SortDirection = "asc" | "desc";

export type TradeSort = {
  key: TradeSortKey;
  direction: SortDirection;
};

export type TradeResultFilter = "all" | "win" | "loss";
export type TradeSideFilter = "all" | TradeSide;

export type TradeLogQuery = {
  search: string;
  resultFilter: TradeResultFilter;
  sideFilter: TradeSideFilter;
  sort: TradeSort;
};

export function getTradeStatusLabel(trade: TradeDto) {
  const pnl = getTradePnl(trade);

  if (pnl > 0) {
    return "WIN";
  }

  if (pnl < 0) {
    return "LOSS";
  }

  return "BE";
}

function compareTradeSortValues(a: TradeDto, b: TradeDto, key: TradeSortKey) {
  if (key === "openedAt") {
    return new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime();
  }

  if (key === "symbol") {
    return a.symbol.localeCompare(b.symbol);
  }

  if (key === "side") {
    return a.side.localeCompare(b.side);
  }

  if (key === "riskDollars") {
    return a.riskDollars - b.riskDollars;
  }

  if (key === "rMultiple") {
    return a.rMultiple - b.rMultiple;
  }

  if (key === "pnl") {
    return getTradePnl(a) - getTradePnl(b);
  }

  if (key === "result") {
    return getTradeStatusLabel(a).localeCompare(getTradeStatusLabel(b));
  }

  return (a.journalEntry?.tradeIdea ?? "").localeCompare(
    b.journalEntry?.tradeIdea ?? ""
  );
}

export function sortTradeLogRows(trades: TradeDto[], sort: TradeSort) {
  const direction = sort.direction === "asc" ? 1 : -1;

  return [...trades].sort((a, b) => {
    const primary = compareTradeSortValues(a, b, sort.key);

    if (primary !== 0) {
      return primary * direction;
    }

    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
      a.id.localeCompare(b.id)
    );
  });
}

export function filterAndSortTradeLogRows(trades: TradeDto[], query: TradeLogQuery) {
  const search = query.search.trim().toLowerCase();
  const visibleTrades = trades.filter((trade) => {
    const journalEntry = trade.journalEntry;

    if (
      search &&
      !trade.symbol.toLowerCase().includes(search) &&
      !journalEntry?.tradeIdea.toLowerCase().includes(search) &&
      !journalEntry?.confluences.toLowerCase().includes(search)
    ) {
      return false;
    }

    if (query.resultFilter === "win" && getTradePnl(trade) <= 0) {
      return false;
    }

    if (query.resultFilter === "loss" && getTradePnl(trade) >= 0) {
      return false;
    }

    if (query.sideFilter !== "all" && trade.side !== query.sideFilter) {
      return false;
    }

    return true;
  });

  return sortTradeLogRows(visibleTrades, query.sort);
}
