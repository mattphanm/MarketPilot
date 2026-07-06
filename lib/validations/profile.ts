import { z } from "zod";

export const ProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/, "Use letters, numbers, and underscores only."),
  bio: z.string().trim().max(280).optional().default(""),
});

export type ProfilePayload = z.infer<typeof ProfileSchema>;
