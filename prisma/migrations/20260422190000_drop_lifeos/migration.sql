-- Eliminar módulo Life OS completo (2026-04-22).
-- Sub-secciones descontinuadas: Mañana, Noche, Journal, Timeline, Cápsula,
-- Emergencia. Deep Work (FocusSession) SE CONSERVA bajo Productividad.

DROP TABLE IF EXISTS "JournalEntry" CASCADE;
DROP TABLE IF EXISTS "TimeCapsule" CASCADE;
DROP TABLE IF EXISTS "MorningRitual" CASCADE;
DROP TABLE IF EXISTS "EveningRitual" CASCADE;
DROP TABLE IF EXISTS "EmergencyCard" CASCADE;
