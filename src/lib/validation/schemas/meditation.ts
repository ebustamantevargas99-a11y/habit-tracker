import { z } from "zod";
import { dateSchema } from "./common";

export const meditationCreateSchema = z.object({
  date: dateSchema.optional(),
  durationMinutes: z.number().int().min(1).max(600),
  type: z.enum(["breathing", "guided", "mindfulness", "yoga", "body-scan"]).optional(),
  moodBefore: z.number().int().min(1).max(10).optional().nullable(),
  moodAfter: z.number().int().min(1).max(10).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
