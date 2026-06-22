import { getTradePnl } from "../analytics/report";
import type { PlaybookDto } from "./types";
import type { TradeDto } from "../trades/types";

export type PlaybookPerformanceTrade = TradeDto & {
  userId?: string;
};

export type PlaybookPerformance = {
  playbook: PlaybookDto;
  trades: TradeDto[];
  winRate: number | null;
  averagePnl: number | null;
  averageRMultiple: number | null;
  totalTrades: number;
  bestTrade: TradeDto | null;
  bestTradePnl: number | null;
  worstTrade: TradeDto | null;
  worstTradePnl: number | null;
};

type Options = {
  userId?: string;
};

export function buildPlaybookPerformance(
  playbooks: PlaybookDto[],
  trades: PlaybookPerformanceTrade[],
  options: Options = {}
): PlaybookPerformance[] {
  const visibleTrades = options.userId
    ? trades.filter((trade) => trade.userId === options.userId)
    : trades;

  return playbooks.map((playbook) => {
    const assignedTrades = visibleTrades.filter(
      (trade) => trade.playbookId === playbook.id
    );
    const totalTrades = assignedTrades.length;
    const pnlValues = assignedTrades.map(getTradePnl);
    const totalPnl = pnlValues.reduce((total, pnl) => total + pnl, 0);
    const totalR = assignedTrades.reduce(
      (total, trade) => total + trade.rMultiple,
      0
    );
    const winningTrades = pnlValues.filter((pnl) => pnl > 0).length;
    const sortedByPnl = [...assignedTrades].sort(
      (a, b) => getTradePnl(b) - getTradePnl(a)
    );
    const bestTrade = sortedByPnl[0] ?? null;
    const worstTrade = sortedByPnl[sortedByPnl.length - 1] ?? null;

    return {
      playbook,
      trades: assignedTrades,
      winRate: totalTrades > 0 ? winningTrades / totalTrades : null,
      averagePnl: totalTrades > 0 ? totalPnl / totalTrades : null,
      averageRMultiple: totalTrades > 0 ? totalR / totalTrades : null,
      totalTrades,
      bestTrade,
      bestTradePnl: bestTrade ? getTradePnl(bestTrade) : null,
      worstTrade,
      worstTradePnl: worstTrade ? getTradePnl(worstTrade) : null,
    };
  });
}
