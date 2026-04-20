import { z } from "zod";
import { dateSchema } from "./common";

const name = z.string().trim().min(1).max(200);

export const lifeAreaCreateSchema = z.object({
  name,
  emoji: z.string().max(10).optional(),
  score: z.number().int().min(1).max(10).optional(),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().max(20).optional(),
});

export const lifeAreaUpdateSchema = z.object({
  name: name.optional(),
  emoji: z.string().max(10).optional(),
  score: z.number().int().min(1).max(10).optional(),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().max(20).optional(),
});

export const noteCreateSchema = z.object({
  title: name,
  content: z.string().max(50000).optional(),
  category: z.string().trim().max(100).optional(),
  tags: z.array(z.string().max(50)).max(50).optional(),
  isPinned: z.boolean().optional(),
  color: z.string().max(20).optional(),
});

export const noteUpdateSchema = z.object({
  title: name.optional(),
  content: z.string().max(50000).optional(),
  category: z.string().trim().max(100).optional(),
  tags: z.array(z.string().max(50)).max(50).optional(),
  isPinned: z.boolean().optional(),
  color: z.string().max(20).optional(),
});

export const weeklyReviewUpsertSchema = z.object({
  weekStart: dateSchema,
  wins: z.array(z.string().max(500)).max(50).optional(),
  challenges: z.array(z.string().max(500)).max(50).optional(),
  learnings: z.array(z.string().max(500)).max(50).optional(),
  nextWeekGoals: z.array(z.string().max(500)).max(50).optional(),
  gratitude: z.array(z.string().max(500)).max(50).optional(),
  overallRating: z.number().int().min(1).max(10).optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
  productivityScore: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(10000).optional().nullable(),
});

export const weeklyReviewUpdateSchema = weeklyReviewUpsertSchema
  .omit({ weekStart: true })
  .partial();
