import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/nutrition/weekly-summary?endDate=YYYY-MM-DD&days=N
 *
 * Por defecto 7 días. Acepta days=30/90/365 para períodos más largos. Útil
 * tanto para el resumen 7d como para las gráficas del hub Progreso.
 *
 * Devuelve:
 *   - days: array por día con calories/protein/carbs/fat
 *   - averages: promedios (sobre días con data)
 *   - adherenceRate: % de días dentro de ±10% de meta (si hay meta)
 *   - streak: días consecutivos dentro de meta hasta hoy
 *   - weekdayVsWeekend: comparativa (detecta el patrón clásico)
 */

export async function GET(req: Request) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const endDate =
      searchParams.get("endDate") ?? new Date().toISOString().split("T")[0];
    const daysParam = Number(searchParams.get("days"));
    const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 730 ? daysParam : 7;

    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    const startDate = start.toISOString().split("T")[0];

    const [meals, goal] = await Promise.all([
      prisma.mealLog.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        include: { items: true },
        orderBy: { date: "asc" },
      }),
      prisma.nutritionGoal.findUnique({ where: { userId } }),
    ]);

    // Group by date
    const byDate: Record<
      string,
      { calories: number; protein: number; carbs: number; fat: number }
    > = {};
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
    const daysArr: Array<{
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      dow: number;
      withinTarget: boolean | null;
    }> = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const entry = byDate[dateStr] ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
      const withinTarget =
        goal && goal.calories > 0
          ? entry.calories > 0
            ? Math.abs(entry.calories - goal.calories) / goal.calories <= 0.1
            : null
          : null;
      daysArr.push({
        date: dateStr,
        ...entry,
        dow: d.getDay(),
        withinTarget,
      });
    }

    const loggedDays = daysArr.filter((d) => d.calories > 0);
    const countLogged = loggedDays.length || 1;
    const total = loggedDays.reduce(
      (acc, d) => ({
        calories: acc.calories + d.calories,
        protein: acc.protein + d.protein,
        carbs: acc.carbs + d.carbs,
        fat: acc.fat + d.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    // Adherence: % de días con data dentro de target
    const daysWithTargetCheck = daysArr.filter((d) => d.withinTarget !== null);
    const daysHit = daysArr.filter((d) => d.withinTarget === true).length;
    const adherenceRate =
      daysWithTargetCheck.length > 0
        ? Math.round((daysHit / daysWithTargetCheck.length) * 100)
        : null;

    // Streak: días consecutivos dentro de meta hasta hoy (excluye hoy si aún vacío)
    let streak = 0;
    for (let i = daysArr.length - 1; i >= 0; i--) {
      const d = daysArr[i];
      if (d.withinTarget === true) streak++;
      else if (d.withinTarget === false) break;
      else if (i === daysArr.length - 1 && d.calories === 0) {
        // Hoy vacío, seguimos contando hacia atrás
        continue;
      } else break;
    }

    // Weekday vs weekend
    const weekdayDays = loggedDays.filter((d) => d.dow >= 1 && d.dow <= 5);
    const weekendDays = loggedDays.filter((d) => d.dow === 0 || d.dow === 6);
    const weekdayVsWeekend =
      weekdayDays.length > 0 && weekendDays.length > 0
        ? {
            weekdayAvgKcal: Math.round(
              weekdayDays.reduce((s, d) => s + d.calories, 0) / weekdayDays.length,
            ),
            weekendAvgKcal: Math.round(
              weekendDays.reduce((s, d) => s + d.calories, 0) / weekendDays.length,
            ),
            deltaKcal: 0,
          }
        : null;
    if (weekdayVsWeekend) {
      weekdayVsWeekend.deltaKcal =
        weekdayVsWeekend.weekendAvgKcal - weekdayVsWeekend.weekdayAvgKcal;
    }

    return NextResponse.json({
      startDate,
      endDate,
      days: daysArr,
      averages: {
        calories: Math.round(total.calories / countLogged),
        protein: Math.round(total.protein / countLogged),
        carbs: Math.round(total.carbs / countLogged),
        fat: Math.round(total.fat / countLogged),
      },
      logged: loggedDays.length,
      totalDays: daysArr.length,
      goal: goal
        ? {
            calories: goal.calories,
            protein: goal.protein,
            carbs: goal.carbs,
            fat: goal.fat,
          }
        : null,
      adherenceRate,
      streak,
      weekdayVsWeekend,
    });
  });
}
