-- Glycemic index / load + net carbs override + 9 aminoácidos esenciales.
-- Útil para ketosis (net carbs), diabetes (GI), atletas (aminos).

-- ─── Glycemic ──────────────────────────────────────────────────────────────
ALTER TABLE "FoodItem" ADD COLUMN "glycemicIndex"  DOUBLE PRECISION;   -- 0-100
ALTER TABLE "FoodItem" ADD COLUMN "glycemicLoad"   DOUBLE PRECISION;   -- GI * carbs/100 per serving
ALTER TABLE "FoodItem" ADD COLUMN "netCarbs"       DOUBLE PRECISION;   -- override manual; si null se calcula carbs-fiber

-- ─── Aminoácidos esenciales (mg por porción) ──────────────────────────────
ALTER TABLE "FoodItem" ADD COLUMN "leucine"        DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN "isoleucine"     DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN "valine"         DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN "lysine"         DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN "methionine"     DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN "phenylalanine"  DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN "threonine"      DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN "tryptophan"     DOUBLE PRECISION;
ALTER TABLE "FoodItem" ADD COLUMN "histidine"      DOUBLE PRECISION;
