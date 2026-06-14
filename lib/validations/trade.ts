import { z } from "zod";
// z is main zod object, giving access to type validators

export const TradeSchema = z.object({ 
    symbol: z.string().min(1),
    // min(1) ensures the string must have at least 1 ch
    side: z.enum(["buy", "sell"]),
    entry: z.number().positive(),
    quantity: z.number().positive(),
    openedAt: z.iso.datetime(),
    notes: z.string().optional(),
})

export type TradeInput = z.infer<typeof TradeSchema>;