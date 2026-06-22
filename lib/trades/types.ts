export type TradeSide = "long" | "short";

export type JournalEntryDto = {
  id: string;
  tradeId: string;
  tradeIdea: string;
  confluences: string;
  createdAt: string;
  updatedAt: string;
};

export type TradeDto = {
  id: string;
  playbookId: string;
  symbol: string;
  side: TradeSide;
  riskDollars: number;
  rMultiple: number;
  openedAt: string;
  createdAt: string;
  updatedAt: string;
  journalEntry: JournalEntryDto | null;
};

export type TradePayload = {
  playbookId: string;
  symbol: string;
  side: TradeSide;
  riskDollars: number;
  rMultiple: number;
  openedAt: string;
  tradeIdea: string;
  confluences: string;
};
