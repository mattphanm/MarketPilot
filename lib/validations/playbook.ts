import { z } from "zod";

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex value like #6C5DD3")
  .transform((value) => value.toUpperCase());

const PlaybookFields = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(500),
    color: hexColor,
    rules: z
      .array(z.string().trim().min(1).max(240))
      .min(1, "At least one rule is required")
      .max(12, "Playbooks can have at most 12 rules"),
  })
  .strict();

export const PlaybookSchema = PlaybookFields;

export const PlaybookUpdateSchema = PlaybookFields.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required",
  }
);

export type PlaybookInput = z.infer<typeof PlaybookSchema>;
export type PlaybookUpdateInput = z.infer<typeof PlaybookUpdateSchema>;
