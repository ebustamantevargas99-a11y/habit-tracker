import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  return withAuth(async (userId) => {

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const [meals, goal] = await Promise.all([
    prisma.mealLog.findMany({
      where: { userId: userId, date },
      include: { items: true },
    }),
    prisma.nutritionGoal.findUnique({ where: { userId: userId } }),
  ]);

  const totals = meals.reduce(
    (acc, meal) => {
      for (const item of meal.items) {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return NextResponse.json({
    date,
    totals,
    goal,
    adherence: goal
      ? {
          calories: Math.min(100, (totals.calories / goal.calories) * 100),
          protein: Math.min(100, (totals.protein / goal.protein) * 100),
          carbs: Math.min(100, (totals.carbs / goal.carbs) * 100),
          fat: Math.min(100, (totals.fat / goal.fat) * 100),
        }
      : null,
  });
});
}
