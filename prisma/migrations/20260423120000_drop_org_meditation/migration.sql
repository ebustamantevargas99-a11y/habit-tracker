-- Eliminar módulo Organización (Note / LifeArea / WeeklyReview) y
-- Meditación (MeditationSession) completos (2026-04-23).
-- Lectura queda pero como sub-tab de Productividad — los modelos
-- Book + ReadingSession se conservan sin cambios.

DROP TABLE IF EXISTS "Note" CASCADE;
DROP TABLE IF EXISTS "LifeArea" CASCADE;
DROP TABLE IF EXISTS "WeeklyReview" CASCADE;
DROP TABLE IF EXISTS "MeditationSession" CASCADE;
