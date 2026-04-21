import { z } from "zod";
import { dateSchema } from "./common";

export const bodyPhotoCreateSchema = z.object({
  date: dateSchema.optional(),
  category: z.enum(["front", "side", "back"]).optional(),
  photoData: z
    .string()
    .min(1)
    .max(3_000_000) // ~3MB base64
    .regex(/^data:image\/(png|jpe?g|webp);base64,/, "Formato inválido"),
  weight: z.number().min(0).max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const timelineMilestoneCreateSchema = z.object({
  date: dateSchema.optional(),
  type: z.enum([
    "habit_streak",
    "pr",
    "weight",
    "book_finished",
    "meditation",
    "fasting",
    "custom",
  ]),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  icon: z.string().max(10).optional().nullable(),
});
