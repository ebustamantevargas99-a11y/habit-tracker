-- Extensión de NutritionGoal para modo "macro split %" (ej. 40/30/30)
-- y custom targets por nutriente (override del FDA DV).

-- ─── Macro split targets (porcentajes de calorías, 0-100) ─────────────────
-- Si proteinPct/carbsPct/fatPct están poblados (y suman ~100), se usan
-- como source-of-truth y derivan gramos. Si están null, se usa modo
-- "gramos absolutos" como antes.
ALTER TABLE "NutritionGoal" ADD COLUMN "useMacroSplit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "NutritionGoal" ADD COLUMN "proteinPct"   DOUBLE PRECISION;
ALTER TABLE "NutritionGoal" ADD COLUMN "carbsPct"     DOUBLE PRECISION;
ALTER TABLE "NutritionGoal" ADD COLUMN "fatPct"       DOUBLE PRECISION;

-- ─── Custom micronutrient targets ─────────────────────────────────────────
-- JSON object con nutrientKey → valor objetivo diario.
-- Ejemplo: { "potassium": 4700, "calcium": 1300, "vitaminD": 25 }
-- Valores null usan el FDA DV 2020 por default.
ALTER TABLE "NutritionGoal" ADD COLUMN "customTargets" JSONB;
