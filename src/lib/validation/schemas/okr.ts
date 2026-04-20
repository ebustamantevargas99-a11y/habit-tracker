import { z } from "zod";
import { dateSchema, nonNegativeNumber } from "./common";

const title = z.string().trim().min(1).max(300);
const description = z.string().trim().max(5000).optional().nullable();

export const objectiveCreateSchema = z.object({
  title,
  description,
  type: z.string().max(50).optional(),
  parentId: z.string().max(64).optional().nullable(),
  startDate: dateSchema.optional().nullable(),
  endDate: dateSchema.optional().nullable(),
  targetValue: nonNegativeNumber.optional(),
  unit: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  emoji: z.string().max(10).optional(),
});

export const objectiveUpdateSchema = z.object({
  title: title.optional(),
  description,
  type: z.string().max(50).optional(),
  parentId: z.string().max(64).optional().nullable(),
  startDate: dateSchema.optional().nullable(),
  endDate: dateSchema.optional().nullable(),
  targetValue: nonNegativeNumber.optional(),
  unit: z.string().max(50).optional(),
  progress: z.number().finite().min(0).max(1000).optional(),
  color: z.string().max(20).optional(),
  emoji: z.string().max(10).optional(),
  isActive: z.boolean().optional(),
});

export const keyResultCreateSchema = z.object({
  title,
  targetValue: nonNegativeNumber,
  currentValue: nonNegativeNumber.optional(),
  unit: z.string().max(50).optional().nullable(),
});

export const keyResultUpdateSchema = keyResultCreateSchema.partial();

export const projectionCreateSchema = z.object({
  objectiveId: z.string().max(64).optional().nullable(),
  name: title,
  model: z.string().max(50).optional(),
  baseline: z.number().finite().optional(),
  goal: z.number().finite().optional(),
  unit: z.string().max(50).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  alertThreshold: z.number().finite().min(0).max(1).optional(),
  autoGenerate: z.boolean().optional(),
});

export const projectionUpdateSchema = z.object({
  name: title.optional(),
  model: z.string().max(50).optional(),
  baseline: z.number().finite().optional(),
  goal: z.number().finite().optional(),
  unit: z.string().max(50).optional(),
  endDate: dateSchema.optional(),
  alertThreshold: z.number().finite().min(0).max(1).optional(),
});

export const milestoneCreateSchema = z.object({
  date: dateSchema,
  value: nonNegativeNumber,
  notes: z.string().max(2000).optional().nullable(),
});
