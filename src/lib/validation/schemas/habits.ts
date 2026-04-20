import { z } from "zod";
import { dateSchema } from "./common";

const name = z.string().trim().min(1).max(200);

export const habitCreateSchema = z.object({
  name,
  icon: z.string().max(10).optional(),
  category: z.string().trim().min(1).max(100),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night", "all"]).optional(),
  frequency: z.enum(["daily", "weekly", "custom"]).optional(),
  targetDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
});

export const habitUpdateSchema = z.object({
  name: name.optional(),
  icon: z.string().max(10).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night", "all"]).optional(),
  frequency: z.enum(["daily", "weekly", "custom"]).optional(),
  targetDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
});

export const habitLogCreateSchema = z.object({
  date: dateSchema.optional(),
  completed: z.boolean().optional(),
});
