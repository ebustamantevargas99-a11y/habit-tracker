import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const [meals, goal] = await Promise.all([
    prisma.mealLog.findMany({
      where: { userId: session.user.id, date },
      include: { items: true },
    }),
    prisma.nutritionGoal.findUnique({ where: { userId: session.user.id } }),
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
}
