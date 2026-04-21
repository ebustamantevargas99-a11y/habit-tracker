import { z } from "zod";

export const subtaskCreateSchema = z.object({
  taskId: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(300),
});

export const subtaskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  completed: z.boolean().optional(),
});
