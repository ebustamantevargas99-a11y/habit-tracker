import { z } from "zod";

const eventTypeEnum = z.enum([
  "custom",
  "meeting",
  "appointment",
  "personal",
  "health",
  "travel",
  "social",
  "work",
  "study",
]);

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color hex #RRGGBB");

export const calendarEventCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(10000).optional().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional().nullable(),
  allDay: z.boolean().optional(),
  type: eventTypeEnum.optional(),
  category: z.string().trim().max(100).optional().nullable(),
  color: hexColor.optional().nullable(),
  icon: z.string().trim().max(10).optional().nullable(),
  location: z.string().trim().max(500).optional().nullable(),
  groupId: z.string().max(40).optional().nullable(),
  recurrence: z.string().trim().max(200).optional().nullable(),
  recurrenceEnd: z.string().datetime().optional().nullable(),
  reminderMinutes: z.number().int().min(0).max(10080).optional().nullable(),
});

export const calendarEventUpdateSchema = calendarEventCreateSchema.partial().extend({
  completed: z.boolean().optional(),
});

// ─── Calendar Groups (estilo iCloud) ──────────────────────────────────────────

export const calendarGroupCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: hexColor.optional(),
  icon: z.string().trim().max(10).optional().nullable(),
  visible: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

export const calendarGroupUpdateSchema = calendarGroupCreateSchema.partial();

export const dayTemplateCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  blocks: z
    .array(
      z.object({
        startHour: z.number().min(0).max(24),
        durHours: z.number().min(0.25).max(24),
        title: z.string().trim().min(1).max(200),
        type: eventTypeEnum.optional(),
        icon: z.string().max(10).optional(),
        color: z.string().optional(),
      })
    )
    .min(1)
    .max(50),
});
