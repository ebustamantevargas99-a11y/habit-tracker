import { z } from "zod";
import { dateSchema, nonNegativeNumber } from "./common";

const name = z.string().trim().min(1).max(200);
const description = z.string().trim().max(5000).optional().nullable();

export const projectCreateSchema = z.object({
  name,
  description,
  color: z.string().max(20).optional(),
  emoji: z.string().max(10).optional(),
});

export const projectUpdateSchema = z.object({
  name: name.optional(),
  description,
  color: z.string().max(20).optional(),
  emoji: z.string().max(10).optional(),
  status: z.enum(["active", "archived", "completed", "deleted"]).optional(),
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description,
  status: z.enum(["todo", "in_progress", "done", "blocked"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().nullable(),
  objectiveId: z.string().max(64).optional().nullable(),
  weight: z.number().int().nonnegative().max(1000).optional(),
  dueDate: dateSchema.optional().nullable(),
  orderIndex: nonNegativeNumber.optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const tasksBulkPatchSchema = z.object({
  tasks: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        status: z.enum(["todo", "in_progress", "done", "blocked"]).optional(),
        orderIndex: nonNegativeNumber.optional(),
        title: z.string().trim().min(1).max(500).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional().nullable(),
        objectiveId: z.string().max(64).optional().nullable(),
        weight: z.number().int().nonnegative().max(1000).optional(),
      })
    )
    .max(200),
});

export const pomodoroCreateSchema = z.object({
  date: dateSchema.optional(),
  duration: z.number().int().positive().max(600),
  task: z.string().trim().max(500).optional().nullable(),
  isWork: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

// ─── Focus Session (Deep Work) ────────────────────────────────────────────────

export const focusSessionStartSchema = z.object({
  plannedMinutes: z.number().int().min(5).max(480).optional(),
  task: z.string().max(500).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
});

export const focusSessionEndSchema = z.object({
  actualMinutes: z.number().int().min(0).max(480).optional(),
  interruptions: z.number().int().min(0).max(100).optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
