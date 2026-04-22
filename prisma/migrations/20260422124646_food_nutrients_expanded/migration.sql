-- Expande FoodItem a nivel Cronometer: desglose de macros + minerales + vitaminas.
-- Todos los campos son opcionales (nullable) — si el usuario no sabe el dato, se
-- queda en NULL y no se suma al dashboard.

-- ─── Macros breakdown ──────────────────────────────────────────────────────
ALTER TABLE "FoodItem" ADD COLUMN     "saturatedFat" DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "transFat"     DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "monoFat"      DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "polyFat"      DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "omega3"       DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "omega6"       DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "cholesterol"  DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "addedSugar"   DOUBLE PRECISION;

-- ─── Minerales (mg salvo indicado) ─────────────────────────────────────────
ALTER TABLE "FoodItem" ADD COLUMN     "potassium"    DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "calcium"      DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "iron"         DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "magnesium"    DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "zinc"         DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN     "phosphorus"   DOUBLE PRECISION;

-- ─── Vitaminas ─────────────────────────────────────────────────────────────
ALTER TABLE "FoodItem" ADD COLUMN     "vitaminA"     DOUBLE PRECISION;  -- μg RAE
ALTER TABLE "FoodItem" ADD COLUMN     "vitaminC"     DOUBLE PRECISION;  -- mg
ALTER TABLE "FoodItem" ADD COLUMN     "vitaminD"     DOUBLE PRECISION;  -- μg
ALTER TABLE "FoodItem" ADD COLUMN     "vitaminE"     DOUBLE PRECISION;  -- mg
ALTER TABLE "FoodItem" ADD COLUMN     "vitaminK"     DOUBLE PRECISION;  -- μg
ALTER TABLE "FoodItem" ADD COLUMN     "thiamin"      DOUBLE PRECISION;  -- B1 mg
ALTER TABLE "FoodItem" ADD COLUMN     "riboflavin"   DOUBLE PRECISION;  -- B2 mg
ALTER TABLE "FoodItem" ADD COLUMN     "niacin"       DOUBLE PRECISION;  -- B3 mg
ALTER TABLE "FoodItem" ADD COLUMN     "vitaminB6"    DOUBLE PRECISION;  -- mg
ALTER TABLE "FoodItem" ADD COLUMN     "folate"       DOUBLE PRECISION;  -- B9 μg
ALTER TABLE "FoodItem" ADD COLUMN     "vitaminB12"   DOUBLE PRECISION;  -- μg

-- ─── Otros ─────────────────────────────────────────────────────────────────
ALTER TABLE "FoodItem" ADD COLUMN     "caffeine"     DOUBLE PRECISION;  -- mg
ALTER TABLE "FoodItem" ADD COLUMN     "alcohol"      DOUBLE PRECISION;  -- g
ALTER TABLE "FoodItem" ADD COLUMN     "water"        DOUBLE PRECISION;  -- g
ALTER TABLE "FoodItem" ADD COLUMN     "category"     TEXT;              -- fruta, carne, lácteo, etc.
ALTER TABLE "FoodItem" ADD COLUMN     "notes"        TEXT;
