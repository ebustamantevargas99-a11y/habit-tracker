import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import {
  computeWeightTrend,
  eta,
  etaDate,
  adherenceRatio,
  movingAverage,
} from "@/lib/nutrition/weight-projection";
import { classifyWeeklyRate } from "@/lib/nutrition/bmr-tdee";

/**
 * GET /api/nutrition/weight-projection?days=60
 *
 * Combina:
 *   - WeightLogs últimos N días
 *   - NutritionGoal (targetWeightKg, weeklyRateKg, startWeightKg)
 *
 * Devuelve tendencia lineal, ETA a meta, adherencia al plan, media móvil.
 * Útil para el hub "Progreso" del redesign de Nutrición.
 */

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const days = Math.min(
      730,
      Math.max(7, Number(req.nextUrl.searchParams.get("days")) || 90),
    );
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    const [goal, logs] = await Promise.all([
      prisma.nutritionGoal.findUnique({ where: { userId } }),
      prisma.weightLog.findMany({
        where: { userId, date: { gte: sinceStr } },
        orderBy: { date: "asc" },
        select: { date: true, weight: true },
      }),
    ]);

    const points = logs.map((l) => ({ date: l.date, weightKg: l.weight }));
    const trend = computeWeightTrend(points);
    const smoothed = movingAverage(points, 7);

    const current = points.length > 0 ? points[points.length - 1] : null;
    const target = goal?.targetWeightKg ?? null;

    let projectedEtaDays: number | null = null;
    let projectedEtaDate: string | null = null;
    let adherence: number | null = null;
    let pace: string | null = null;

    if (trend && current && target != null) {
      projectedEtaDays = eta({
        currentWeightKg: current.weightKg,
        targetWeightKg: target,
        slopeKgPerDay: trend.slopeKgPerDay,
      });
      projectedEtaDate = etaDate({
        currentWeightKg: current.weightKg,
        targetWeightKg: target,
        slopeKgPerDay: trend.slopeKgPerDay,
        fromDate: current.date,
      });
    }

    if (trend && goal?.weeklyRateKg != null) {
      adherence = adherenceRatio({
        plannedWeeklyKg: goal.weeklyRateKg,
        actualWeeklyKg: trend.weeklyRateKg,
      });
    }

    if (trend && current) {
      pace = classifyWeeklyRate(trend.weeklyRateKg, current.weightKg);
    }

    return NextResponse.json({
      days,
      points,
      smoothed,
      trend,
      current,
      goal: goal
        ? {
            targetWeightKg: goal.targetWeightKg,
            startWeightKg: goal.startWeightKg,
            startDate: goal.startDate,
            targetDate: goal.targetDate,
            weeklyRateKg: goal.weeklyRateKg,
            goalType: goal.goalType,
          }
        : null,
      projection: {
        etaDays: projectedEtaDays,
        etaDate: projectedEtaDate,
        adherenceRatio: adherence,
        pace,
      },
    });
  });
}
