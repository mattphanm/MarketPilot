import { z } from "zod";
// Shared validation for trade write operations.
export const TradeSchema = z.object({
  symbol: z.string().trim().min(1).max(20).transform((value) => value.toUpperCase()),
  side: z.enum(["buy", "sell"]),
  entry: z.number().positive(),
  exit: z.number().positive().optional(),
  quantity: z.number().int().positive(),
  openedAt: z.iso.datetime(),
  closedAt: z.iso.datetime().optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const TradeUpdateSchema = TradeSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export type TradeInput = z.infer<typeof TradeSchema>;
export type TradeUpdateInput = z.infer<typeof TradeUpdateSchema>;
