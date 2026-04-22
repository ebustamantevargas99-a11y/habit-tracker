import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { parseJson, nutritionGoalUpsertSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const goal = await prisma.nutritionGoal.findUnique({ where: { userId } });
    return NextResponse.json(goal);
  });
}

export async function PUT(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, nutritionGoalUpsertSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const goal = await prisma.nutritionGoal.upsert({
      where: { userId },
      update: {
        ...(d.calories !== undefined && { calories: d.calories }),
        ...(d.protein !== undefined && { protein: d.protein }),
        ...(d.carbs !== undefined && { carbs: d.carbs }),
        ...(d.fat !== undefined && { fat: d.fat }),
        ...(d.fiber !== undefined && { fiber: d.fiber }),
        ...(d.waterMl !== undefined && { waterMl: d.waterMl }),
        ...(d.mealsPerDay !== undefined && { mealsPerDay: d.mealsPerDay }),
        // Objetivo de peso + metabolismo (Fase redesign Nutrición)
        ...(d.goalType !== undefined && { goalType: d.goalType }),
        ...(d.targetWeightKg !== undefined && { targetWeightKg: d.targetWeightKg }),
        ...(d.startWeightKg !== undefined && { startWeightKg: d.startWeightKg }),
        ...(d.startDate !== undefined && { startDate: d.startDate }),
        ...(d.targetDate !== undefined && { targetDate: d.targetDate }),
        ...(d.weeklyRateKg !== undefined && { weeklyRateKg: d.weeklyRateKg }),
        ...(d.bmrKcal !== undefined && { bmrKcal: d.bmrKcal }),
        ...(d.tdeeKcal !== undefined && { tdeeKcal: d.tdeeKcal }),
        ...(d.activityFactor !== undefined && { activityFactor: d.activityFactor }),
        ...(d.targetBodyFatPercent !== undefined && { targetBodyFatPercent: d.targetBodyFatPercent }),
        ...(d.targetLeanMassKg !== undefined && { targetLeanMassKg: d.targetLeanMassKg }),
        ...(d.useMacroSplit !== undefined && { useMacroSplit: d.useMacroSplit }),
        ...(d.proteinPct !== undefined && { proteinPct: d.proteinPct }),
        ...(d.carbsPct !== undefined && { carbsPct: d.carbsPct }),
        ...(d.fatPct !== undefined && { fatPct: d.fatPct }),
        ...(d.customTargets !== undefined && {
          // Prisma Json nullable: null explícito necesita Prisma.JsonNull
          customTargets:
            d.customTargets === null
              ? Prisma.JsonNull
              : (d.customTargets as Prisma.InputJsonValue),
        }),
      },
      create: {
        userId,
        calories: d.calories ?? 2000,
        protein: d.protein ?? 150,
        carbs: d.carbs ?? 200,
        fat: d.fat ?? 65,
        fiber: d.fiber ?? 25,
        waterMl: d.waterMl ?? 2500,
        mealsPerDay: d.mealsPerDay ?? 3,
        goalType: d.goalType ?? null,
        targetWeightKg: d.targetWeightKg ?? null,
        startWeightKg: d.startWeightKg ?? null,
        startDate: d.startDate ?? null,
        targetDate: d.targetDate ?? null,
        weeklyRateKg: d.weeklyRateKg ?? null,
        bmrKcal: d.bmrKcal ?? null,
        tdeeKcal: d.tdeeKcal ?? null,
        activityFactor: d.activityFactor ?? null,
        targetBodyFatPercent: d.targetBodyFatPercent ?? null,
        targetLeanMassKg: d.targetLeanMassKg ?? null,
        useMacroSplit: d.useMacroSplit ?? false,
        proteinPct: d.proteinPct ?? null,
        carbsPct: d.carbsPct ?? null,
        fatPct: d.fatPct ?? null,
        ...(d.customTargets != null && { customTargets: d.customTargets }),
      },
    });
    return NextResponse.json(goal);
  });
}
