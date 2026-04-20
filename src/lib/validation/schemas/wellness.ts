import { z } from "zod";
import { dateSchema, positiveNumber } from "./common";

const notes = z.string().trim().max(2000).optional().nullable();
const name = z.string().trim().min(1).max(200);

export const moodCreateSchema = z.object({
  date: dateSchema.optional(),
  mood: z.number().int().min(1).max(10),
  emotions: z.array(z.string().max(50)).max(30).optional(),
  factors: z.array(z.string().max(50)).max(30).optional(),
  notes,
});

export const sleepCreateSchema = z.object({
  date: dateSchema,
  bedtime: z.string().max(10).optional().nullable(),
  wakeTime: z.string().max(10).optional().nullable(),
  hours: z.number().finite().min(0).max(24),
  quality: z.number().int().min(1).max(10).optional().nullable(),
  notes,
});

export const hydrationCreateSchema = z.object({
  date: dateSchema.optional(),
  amount: positiveNumber,
  unit: z.enum(["ml", "oz", "cup"]).optional(),
});

const supplementFactSchema = z.object({
  nutrient: z.string().trim().min(1).max(100),
  amount: z.string().trim().min(1).max(100),
  dailyValuePct: z.string().max(50).optional().nullable(),
});

export const medicationCreateSchema = z.object({
  name,
  brand: z.string().trim().max(200).optional().nullable(),
  dosage: z.string().trim().max(200).optional().nullable(),
  frequency: z.string().trim().max(100).optional(),
  timeOfDay: z.string().trim().max(100).optional().nullable(),
  supplementFacts: z.array(supplementFactSchema).max(50).optional().nullable(),
});

export const medicationUpdateSchema = z.object({
  name: name.optional(),
  brand: z.string().trim().max(200).optional().nullable(),
  dosage: z.string().trim().max(200).optional().nullable(),
  frequency: z.string().trim().max(100).optional(),
  timeOfDay: z.string().trim().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const medicationLogUpsertSchema = z.object({
  date: dateSchema.optional(),
  taken: z.boolean().optional(),
  notes,
});

export const symptomCreateSchema = z.object({
  date: dateSchema.optional(),
  symptom: z.string().trim().min(1).max(200),
  intensity: z.number().int().min(1).max(10),
  duration: z.string().max(100).optional().nullable(),
  notes,
});

export const appointmentCreateSchema = z.object({
  doctorName: z.string().trim().min(1).max(200),
  specialty: z.string().trim().max(200).optional(),
  location: z.string().trim().max(500).optional().nullable(),
  dateTime: z.string().min(1).max(50).optional(),
  reason: z.string().trim().max(2000).optional().nullable(),
  notes,
});

export const appointmentUpdateSchema = z.object({
  doctorName: z.string().trim().min(1).max(200).optional(),
  specialty: z.string().trim().max(200).optional(),
  location: z.string().trim().max(500).optional().nullable(),
  dateTime: z.string().min(1).max(50).optional(),
  reason: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["pending", "completed", "cancelled", "rescheduled"]).optional(),
  result: z.string().trim().max(5000).optional().nullable(),
  notes,
});
