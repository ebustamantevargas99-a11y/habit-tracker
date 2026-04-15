import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  // Default: last 7 days
  const endDate = searchParams.get("endDate") ?? new Date().toISOString().split("T")[0];
  const end = new Date(endDate);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const startDate = start.toISOString().split("T")[0];

  const meals = await prisma.mealLog.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startDate, lte: endDate },
    },
    include: { items: true },
    orderBy: { date: "asc" },
  });

  // Group by date
  const byDate: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
  for (const meal of meals) {
    if (!byDate[meal.date]) byDate[meal.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const item of meal.items) {
      byDate[meal.date].calories += item.calories;
      byDate[meal.date].protein += item.protein;
      byDate[meal.date].carbs += item.carbs;
      byDate[meal.date].fat += item.fat;
    }
  }

  // Fill missing days
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    days.push({ date: dateStr, ...(byDate[dateStr] ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }) });
  }

  const total = days.reduce((acc, d) => {
    acc.calories += d.calories;
    acc.protein += d.protein;
    acc.carbs += d.carbs;
    acc.fat += d.fat;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const count = days.filter((d) => d.calories > 0).length || 1;

  return NextResponse.json({
    startDate,
    endDate,
    days,
    averages: {
      calories: total.calories / count,
      protein: total.protein / count,
      carbs: total.carbs / count,
      fat: total.fat / count,
    },
  });
}
