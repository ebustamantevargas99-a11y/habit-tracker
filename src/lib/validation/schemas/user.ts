import { z } from "zod";
import { nonNegativeNumber } from "./common";

const BIOLOGICAL_SEX = ["male", "female", "intersex", "prefer_not_say"] as const;
const ACTIVITY_LEVEL = ["sedentary", "light", "moderate", "active", "very_active"] as const;
const FITNESS_LEVEL = ["beginner", "intermediate", "advanced"] as const;
const INTEREST_KEYS = [
  "training", "nutrition", "mindfulness", "finance", "productivity",
  "study", "reading", "sleep", "hydration", "fasting",
  "menstrualCycle", "pregnancy", "medications", "none",
] as const;
const MODULE_KEYS = [
  "home", "habits", "mood", "tasks", "settings", "fitness", "nutrition",
  "fasting", "sleep", "hydration", "finance", "projects", "planner",
  "meditation", "reading", "medications", "menstrualCycle", "pregnancy",
  "organization", "gamification", "journal",
] as const;

export const onboardingSchema = z.object({
  name: z.string().trim().min(1).max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  biologicalSex: z.enum(BIOLOGICAL_SEX),
  gender: z.string().max(50).optional().nullable(),
  pronouns: z.string().max(50).optional().nullable(),
  heightCm: z.number().finite().positive().max(300).optional().nullable(),
  weightKg: z.number().finite().positive().max(500).optional().nullable(),
  activityLevel: z.enum(ACTIVITY_LEVEL).optional().nullable(),
  fitnessLevel: z.enum(FITNESS_LEVEL).optional().nullable(),
  units: z.enum(["metric", "imperial"]).default("metric"),
  primaryCurrency: z.string().regex(/^[A-Z]{3}$/, "Moneda ISO").default("MXN"),
  language: z.string().min(2).max(10).default("es"),
  timezone: z.string().max(50).default("America/Mexico_City"),
  darkMode: z.boolean().default(false),
  interests: z.array(z.enum(INTEREST_KEYS)).max(20).default([]),
  primaryGoals: z.array(z.string().max(200)).max(10).default([]),
  conditions: z.array(z.string().max(200)).max(30).default([]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const enabledModulesUpdateSchema = z.object({
  enabledModules: z.array(z.enum(MODULE_KEYS)).max(50),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  timezone: z.string().max(50).optional(),
  units: z.enum(["metric", "imperial"]).optional(),
  primaryCurrency: z.string().regex(/^[A-Z]{3}$/, "Moneda ISO").optional(),
  language: z.string().max(10).optional(),
  theme: z.enum(["warm", "cool", "dark", "light"]).optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
  stepsGoal: z.number().int().nonnegative().max(100000).optional(),
  waterGoal: nonNegativeNumber.optional(),
  sleepGoal: nonNegativeNumber.optional(),
});

