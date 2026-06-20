import { z } from "zod";

// Shared validation for trade write operations.
const TradeFields = z.object({
  symbol: z.string().trim().min(1).max(20).transform((value) => value.toUpperCase()),
  side: z.enum(["buy", "sell"]),
  entry: z.number().positive(),
  exit: z.number().positive().optional(),
  quantity: z.number().int().positive(),
  openedAt: z.iso.datetime(),
  closedAt: z.iso.datetime().optional(),
  notes: z.string().trim().max(5000).optional(),
}).strict();

export const TradeSchema = TradeFields.refine(
  (data) => !data.closedAt || new Date(data.closedAt) >= new Date(data.openedAt),
  { message: "closedAt must be after openedAt", path: ["closedAt"] }
);

export const TradeUpdateSchema = TradeFields.partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })
  .refine(
    (data) =>
      !data.openedAt ||
      !data.closedAt ||
      new Date(data.closedAt) >= new Date(data.openedAt),
    { message: "closedAt must be after openedAt", path: ["closedAt"] }
  );

export type TradeInput = z.infer<typeof TradeSchema>;
export type TradeUpdateInput = z.infer<typeof TradeUpdateSchema>;
