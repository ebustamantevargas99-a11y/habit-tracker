import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
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
      },
    });
    return NextResponse.json(goal);
  });
}
