import { z } from "zod";

// ─── Reset scopes ─────────────────────────────────────────────────────────────
// Cada scope define qué conjunto de datos se borra. "all" ejecuta todos.

export const resetScopeEnum = z.enum([
  "habits",
  "fitness",
  "cardio",
  "finance",
  "nutrition",
  "productivity",
  "organization",
  "calendar",
  "reading",
  "lifeos",
  "cycle",
  "milestones",
  "gamification",
  "all",
]);

export type ResetScope = z.infer<typeof resetScopeEnum>;

// Confirmación explícita para evitar destructivos accidentales.
// El UI pide al user escribir "RESETEAR" (case-sensitive).
export const resetDataSchema = z.object({
  scope: resetScopeEnum,
  confirmation: z.literal("RESETEAR", {
    message: 'Debes escribir "RESETEAR" para confirmar',
  }),
});
