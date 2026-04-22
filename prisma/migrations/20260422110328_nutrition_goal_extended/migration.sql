-- AlterTable: extend NutritionGoal with weight goal + BMR/TDEE + body composition targets
ALTER TABLE "NutritionGoal" ADD COLUMN "activityFactor" DOUBLE PRECISION,
ADD COLUMN "bmrKcal" INTEGER,
ADD COLUMN "goalType" TEXT,
ADD COLUMN "startDate" TEXT,
ADD COLUMN "startWeightKg" DOUBLE PRECISION,
ADD COLUMN "targetBodyFatPercent" DOUBLE PRECISION,
ADD COLUMN "targetDate" TEXT,
ADD COLUMN "targetLeanMassKg" DOUBLE PRECISION,
ADD COLUMN "targetWeightKg" DOUBLE PRECISION,
ADD COLUMN "tdeeKcal" INTEGER,
ADD COLUMN "weeklyRateKg" DOUBLE PRECISION;
