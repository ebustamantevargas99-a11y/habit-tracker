import { z } from "zod";
import { dateSchema } from "./common";

const title = z.string().trim().min(1).max(300);
const bookStatus = z.enum(["reading", "finished", "want", "paused"]);

export const bookCreateSchema = z.object({
  title,
  author: z.string().trim().max(200).optional().nullable(),
  totalPages: z.number().int().positive().max(100000).optional().nullable(),
  currentPage: z.number().int().nonnegative().max(100000).optional(),
  status: bookStatus.optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  coverUrl: z.string().trim().url().max(2000).optional().nullable(),
  genre: z.string().trim().max(100).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  startedAt: dateSchema.optional().nullable(),
  finishedAt: dateSchema.optional().nullable(),
});

export const bookUpdateSchema = bookCreateSchema.partial();

export const readingSessionCreateSchema = z.object({
  date: dateSchema.optional(),
  pagesRead: z.number().int().nonnegative().max(10000).optional(),
  minutes: z.number().int().nonnegative().max(1440).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
