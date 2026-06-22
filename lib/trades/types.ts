export type TradeSide = "buy" | "sell";

export type TradeDto = {
  id: string;
  playbookId: string | null;
  symbol: string;
  side: TradeSide;
  entry: number;
  exit: number | null;
  quantity: number;
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TradePayload = {
  symbol: string;
  side: TradeSide;
  entry: number;
  exit?: number;
  quantity: number;
  openedAt: string;
  closedAt?: string;
  notes?: string;
};
