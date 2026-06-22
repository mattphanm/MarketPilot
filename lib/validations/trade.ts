import { z } from "zod";

// Shared validation for trade write operations.
const TradeFields = z.object({
  playbookId: z.string().trim().min(1),
  symbol: z.string().trim().min(1).max(20).transform((value) => value.toUpperCase()),
  side: z.enum(["long", "short"]),
  riskDollars: z.number().positive(),
  rMultiple: z.number().min(-50).max(50),
  openedAt: z.iso.datetime(),
  tradeIdea: z.string().trim().min(1).max(5000),
  confluences: z.string().trim().min(1).max(5000),
}).strict();

export const TradeSchema = TradeFields;

export const TradeUpdateSchema = TradeFields.partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type TradeInput = z.infer<typeof TradeSchema>;
export type TradeUpdateInput = z.infer<typeof TradeUpdateSchema>;
