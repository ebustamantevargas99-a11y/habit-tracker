import { z } from "zod";
import { dateSchema } from "./common";

export const cycleCreateSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema.optional().nullable(),
  periodLength: z.number().int().min(1).max(15).optional().nullable(),
  flowHeavy: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const cycleUpdateSchema = cycleCreateSchema.partial();

export const periodLogCreateSchema = z.object({
  date: dateSchema,
  flow: z.enum(["none", "spotting", "light", "medium", "heavy"]),
  symptoms: z.array(z.string().max(50)).max(20).optional(),
  mood: z.number().int().min(1).max(10).optional().nullable(),
  energy: z.number().int().min(1).max(10).optional().nullable(),
  libido: z.number().int().min(1).max(10).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
