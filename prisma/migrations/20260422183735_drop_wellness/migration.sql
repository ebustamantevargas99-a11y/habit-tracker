-- Eliminar módulo Bienestar completo (2026-04-22).
-- Razón: redundancias con otros módulos + UI antigua. Específicamente:
--   · Hidratación ya existía en Nutrición → Hoy (el modelo HydrationLog se
--     conserva bajo /api/nutrition/hydration)
--   · Health Log (glucosa/BP/lípidos) → reemplazado por BloodMarker en
--     Nutrición → Composición → Marcadores sangre
--   · Sleep Tracker → descontinuado
--   · Medication → descontinuado (supplementos/vitaminas se loggean como
--     alimentos custom con nutrientes)
--   · Symptom Log / Medical Appointments → descontinuados

-- Orden: primero tablas con FK hacia las que vamos a borrar.
DROP TABLE IF EXISTS "SupplementFact" CASCADE;
DROP TABLE IF EXISTS "MedicationLog" CASCADE;
DROP TABLE IF EXISTS "Medication" CASCADE;
DROP TABLE IF EXISTS "SymptomLog" CASCADE;
DROP TABLE IF EXISTS "MedicalAppointment" CASCADE;
DROP TABLE IF EXISTS "SleepLog" CASCADE;
DROP TABLE IF EXISTS "MoodLog" CASCADE;

-- HydrationLog SE QUEDA (ahora bajo Nutrición).
