import { z } from "zod";
import { dateSchema } from "./common";

// ─── Time Capsule ─────────────────────────────────────────────────────────────

export const timeCapsuleCreateSchema = z.object({
  message: z.string().min(1).max(10000),
  unlockAt: z.string().datetime(),
});

// ─── Focus Session ────────────────────────────────────────────────────────────

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

// ─── Morning / Evening rituals ────────────────────────────────────────────────

export const morningRitualUpsertSchema = z.object({
  date: dateSchema.optional(),
  wakeTime: z.string().max(10).optional().nullable(),
  hydration: z.boolean().optional(),
  meditation: z.boolean().optional(),
  intention: z.string().max(500).optional().nullable(),
  gratitude: z.array(z.string().max(300)).max(10).optional(),
  energy: z.number().int().min(1).max(10).optional().nullable(),
});

export const eveningRitualUpsertSchema = z.object({
  date: dateSchema.optional(),
  sleepTime: z.string().max(10).optional().nullable(),
  reflection: z.string().max(2000).optional().nullable(),
  gratitude: z.array(z.string().max(300)).max(10).optional(),
  tomorrowTop3: z.array(z.string().max(300)).max(3).optional(),
  medsDone: z.boolean().optional(),
});

// ─── Journal ──────────────────────────────────────────────────────────────────

export const journalEntryCreateSchema = z.object({
  date: dateSchema.optional(),
  prompt: z.string().max(500).optional().nullable(),
  content: z.string().min(1).max(50000),
  mood: z.number().int().min(1).max(10).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

// ─── Emergency Card ───────────────────────────────────────────────────────────

export const emergencyCardUpsertSchema = z.object({
  bloodType: z.string().max(5).optional().nullable(),
  allergies: z.array(z.string().max(100)).max(30).optional(),
  conditions: z.array(z.string().max(200)).max(30).optional(),
  medications: z.array(z.string().max(200)).max(30).optional(),
  emergencyName: z.string().max(200).optional().nullable(),
  emergencyPhone: z.string().max(50).optional().nullable(),
  emergencyRelation: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const emergencyShareSchema = z.object({
  hours: z.number().int().min(1).max(72).optional(),
});
