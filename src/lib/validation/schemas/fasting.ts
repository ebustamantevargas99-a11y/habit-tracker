import { z } from "zod";

export const fastingStartSchema = z.object({
  startedAt: z.string().datetime().optional(),
  targetHours: z.number().int().min(1).max(72).optional(),
  protocol: z.string().max(50).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const fastingEndSchema = z.object({
  endedAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional().nullable(),
});
