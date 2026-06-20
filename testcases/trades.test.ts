import { describe, expect, it } from "vitest";
import { TradeSchema, TradeUpdateSchema } from "../lib/validations/trade";

type TestPath = "happy" | "edge" | "failure";

type TestCase = {
  path: TestPath;
  name: string;
  expectation: string;
};

export const tradeTestCases: TestCase[] = [
  {
    path: "happy",
    name: "creates a valid trade for the authenticated user",
    expectation: "POST /api/trades validates input, stores the trade with userId, and returns status 201.",
  },
  {
    path: "happy",
    name: "returns only the authenticated user's trades",
    expectation: "GET /api/trades filters by userId and orders trades by openedAt then createdAt descending.",
  },
  {
    path: "edge",
    name: "updates only fields included in a partial trade payload",
    expectation: "PATCH /api/trades/[id] leaves omitted fields unchanged.",
  },
  {
    path: "edge",
    name: "allows a trade to be created without optional exit fields",
    expectation: "POST /api/trades accepts missing exit, closedAt, and notes fields.",
  },
  {
    path: "failure",
    name: "rejects invalid trade input",
    expectation: "POST or PATCH returns status 400 with validation issues for malformed payloads.",
  },
  {
    path: "failure",
    name: "prevents access to another user's trade",
    expectation: "GET, PATCH, and DELETE /api/trades/[id] return status 404 when id does not belong to the user.",
  },
];

const validTradePayload = {
  symbol: " aapl ",
  side: "buy",
  entry: 185.25,
  quantity: 10,
  openedAt: "2026-06-20T14:30:00.000Z",
};

describe("trade validation", () => {
  it("happy: accepts a valid trade create payload", () => {
    const result = TradeSchema.safeParse(validTradePayload);

    expect(result.success).toBe(true);
  });

  it("happy: normalizes trade symbols to uppercase", () => {
    const result = TradeSchema.safeParse(validTradePayload);

    expect(result.success && result.data.symbol).toBe("AAPL");
  });

  it("edge: accepts a partial update with one field", () => {
    const result = TradeUpdateSchema.safeParse({ notes: "Trimmed winner." });

    expect(result.success).toBe(true);
  });

  it("edge: accepts missing optional exit fields on create", () => {
    const result = TradeSchema.safeParse(validTradePayload);

    expect(result.success).toBe(true);
    expect(result.success && result.data.exit).toBeUndefined();
    expect(result.success && result.data.closedAt).toBeUndefined();
  });

  it("failure: rejects an empty update payload", () => {
    const result = TradeUpdateSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("failure: rejects closedAt before openedAt", () => {
    const result = TradeSchema.safeParse({
      ...validTradePayload,
      closedAt: "2026-06-20T13:30:00.000Z",
    });

    expect(result.success).toBe(false);
  });
});
