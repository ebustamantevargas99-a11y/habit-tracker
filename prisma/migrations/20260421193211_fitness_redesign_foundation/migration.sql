/*
  Warnings:

  - You are about to drop the `FastingLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeeklyPlan` table. If the table is not empty, all the data it contains will be lost.

  — Clean slate aprobada por el user el 2026-04-21 para el redesign Fitness Fase 9.
    Todos los Workouts/PRs/métricas/pesos/pasos/retos/ayunos legacy son descartados.
    Los Exercise (catálogo + custom) se preservan — los campos nuevos quedan NULL y
    se enriquecen gradualmente vía seed/UI.

*/

-- Clean slate: vaciar data fitness legacy antes del DROP/ALTER (user approved 2026-04-21).
TRUNCATE TABLE
  "WorkoutSet",
  "WorkoutExercise",
  "Workout",
  "PersonalRecord",
  "BodyMetric",
  "WeightLog",
  "StepsLog",
  "FitnessChallenge"
CASCADE;

-- DropForeignKey
ALTER TABLE "FastingLog" DROP CONSTRAINT "FastingLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "WeeklyPlan" DROP CONSTRAINT "WeeklyPlan_userId_fkey";

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "alternatives" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "commonMistakes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "equipmentList" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "formTips" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "primaryMuscle" TEXT,
ADD COLUMN     "secondaryMuscles" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "plannedPhaseId" TEXT,
ADD COLUMN     "readinessScore" INTEGER,
ADD COLUMN     "trimp" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "WorkoutSet" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "isWarmup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rir" INTEGER,
ADD COLUMN     "setType" TEXT NOT NULL DEFAULT 'straight',
ADD COLUMN     "tempo" TEXT;

-- DropTable
DROP TABLE "FastingLog";

-- DropTable
DROP TABLE "WeeklyPlan";

-- CreateTable
CREATE TABLE "TrainingProgram" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'linear',
    "goal" TEXT,
    "durationWeeks" INTEGER NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "daysPerWeek" INTEGER NOT NULL DEFAULT 4,
    "schedule" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramPhase" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weekStart" INTEGER NOT NULL,
    "weekEnd" INTEGER NOT NULL,
    "targetRpeMin" DOUBLE PRECISION,
    "targetRpeMax" DOUBLE PRECISION,
    "targetSetsPerMuscle" INTEGER,
    "notes" TEXT,

    CONSTRAINT "ProgramPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadinessCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "restingHr" INTEGER,
    "hrv" INTEGER,
    "sleepHours" DOUBLE PRECISION,
    "sleepQuality" INTEGER,
    "soreness" INTEGER,
    "stress" INTEGER,
    "mood" INTEGER,
    "energy" INTEGER,
    "motivation" INTEGER,
    "score" INTEGER,
    "recommendation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadinessCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardioSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "activityType" TEXT NOT NULL DEFAULT 'run',
    "distanceKm" DOUBLE PRECISION,
    "durationSec" INTEGER NOT NULL,
    "avgPaceSecPerKm" DOUBLE PRECISION,
    "avgHr" INTEGER,
    "maxHr" INTEGER,
    "elevationGainM" DOUBLE PRECISION,
    "caloriesBurned" DOUBLE PRECISION,
    "perceivedExertion" INTEGER,
    "zones" JSONB,
    "splits" JSONB,
    "route" JSONB,
    "shoeId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardioSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shoe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "purchaseDate" TEXT,
    "currentKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxKm" DOUBLE PRECISION NOT NULL DEFAULT 800,
    "retired" BOOLEAN NOT NULL DEFAULT false,
    "retiredAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shoe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyComposition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "bodyFatPercent" DOUBLE PRECISION,
    "leanMassKg" DOUBLE PRECISION,
    "fatMassKg" DOUBLE PRECISION,
    "waterPercent" DOUBLE PRECISION,
    "visceralFat" DOUBLE PRECISION,
    "boneMassKg" DOUBLE PRECISION,
    "bmr" INTEGER,
    "method" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyComposition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingProgram_userId_active_idx" ON "TrainingProgram"("userId", "active");

-- CreateIndex
CREATE INDEX "ProgramPhase_programId_weekStart_idx" ON "ProgramPhase"("programId", "weekStart");

-- CreateIndex
CREATE INDEX "ReadinessCheck_userId_date_idx" ON "ReadinessCheck"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessCheck_userId_date_key" ON "ReadinessCheck"("userId", "date");

-- CreateIndex
CREATE INDEX "CardioSession_userId_date_idx" ON "CardioSession"("userId", "date");

-- CreateIndex
CREATE INDEX "CardioSession_userId_activityType_date_idx" ON "CardioSession"("userId", "activityType", "date");

-- CreateIndex
CREATE INDEX "Shoe_userId_retired_idx" ON "Shoe"("userId", "retired");

-- CreateIndex
CREATE INDEX "BodyComposition_userId_date_idx" ON "BodyComposition"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BodyComposition_userId_date_key" ON "BodyComposition"("userId", "date");

-- CreateIndex
CREATE INDEX "Exercise_primaryMuscle_idx" ON "Exercise"("primaryMuscle");

-- CreateIndex
CREATE INDEX "Workout_plannedPhaseId_idx" ON "Workout"("plannedPhaseId");

-- CreateIndex
CREATE INDEX "WorkoutSet_groupId_idx" ON "WorkoutSet"("groupId");

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_plannedPhaseId_fkey" FOREIGN KEY ("plannedPhaseId") REFERENCES "ProgramPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramPhase" ADD CONSTRAINT "ProgramPhase_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessCheck" ADD CONSTRAINT "ReadinessCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardioSession" ADD CONSTRAINT "CardioSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardioSession" ADD CONSTRAINT "CardioSession_shoeId_fkey" FOREIGN KEY ("shoeId") REFERENCES "Shoe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shoe" ADD CONSTRAINT "Shoe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyComposition" ADD CONSTRAINT "BodyComposition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
