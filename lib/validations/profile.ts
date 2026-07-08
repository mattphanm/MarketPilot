import { z } from "zod";

export const RESERVED_USERNAMES = new Set([
  "settings",
  "admin",
  "api",
  "login",
  "marketpilot",
]);

export const ProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(25, "Display name must be 25 characters or fewer."),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Username is required.")
    .max(24, "Username must be 24 characters or fewer.")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only.")
    .refine((username) => username.length >= 3, {
      message: "Username must be at least 3 characters.",
    })
    .refine((username) => !RESERVED_USERNAMES.has(username), {
      message: "This username is reserved.",
    }),
  bio: z
    .string()
    .trim()
    .max(280, "Bio must be 280 characters or fewer.")
    .optional()
    .default("")
    .transform((bio) => bio || ""),
});

export type ProfilePayload = z.infer<typeof ProfileSchema>;
