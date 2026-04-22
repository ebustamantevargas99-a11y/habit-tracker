import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

/**
 * Nutrient report N días — detecta deficiencias y top sources.
 *
 * Para cada nutriente trackeado:
 *   - Promedio diario últimos N días (suma de todos los MealItems / días)
 *   - % del Daily Value FDA 2020 (o customTargets del user si existe)
 *   - Clasificación: deficient <50%, low 50-75%, adequate 75-100%,
 *     excess 100-120%, very_high >120%
 *   - Top 5 "sources": qué foods aportan más de ese nutriente (por
 *     cantidad acumulada en N días)
 *
 * GET /nutrition/nutrient-report?days=30
 */

// FDA Daily Values 2020 (2000 kcal base). Si el user tiene customTargets
// en NutritionGoal, esos sobrescriben.
const DEFAULT_DV: Record<string, number> = {
  protein: 50,
  carbs: 275,
  fat: 78,
  fiber: 28,
  saturatedFat: 20,
  cholesterol: 300,
  sodium: 2300,
  addedSugar: 50,
  potassium: 4700,
  calcium: 1300,
  iron: 18,
  magnesium: 420,
  zinc: 11,
  phosphorus: 1250,
  vitaminA: 900,
  vitaminC: 90,
  vitaminD: 20,
  vitaminE: 15,
  vitaminK: 120,
  thiamin: 1.2,
  riboflavin: 1.3,
  niacin: 16,
  vitaminB6: 1.7,
  folate: 400,
  vitaminB12: 2.4,
  leucine: 2500,
};

// Nutrientes que se calculan en el report
const TRACKED_NUTRIENTS = Object.keys(DEFAULT_DV);

type NutrientRowDb = {
  foodItemId: string;
  quantity: number;
  unit: string;
  foodItem: Record<string, unknown>;
};

interface NutrientReport {
  nutrient: string;
  dailyAverage: number;
  dailyTarget: number;
  pctDv: number;
  classification: "deficient" | "low" | "adequate" | "excess" | "very_high";
  topSources: Array<{
    foodItemId: string;
    name: string;
    brand: string | null;
    amountPerDay: number;   // cantidad del nutriente aportada /día promedio
    pctOfTotal: number;     // % de la ingesta total del user de ese nutriente
  }>;
}

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const daysParam = parseInt(searchParams.get("days") ?? "30", 10);
    const days = Math.max(1, Math.min(365, Number.isFinite(daysParam) ? daysParam : 30));

    // Ventana de fechas YYYY-MM-DD
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const fromStr = startDate.toISOString().slice(0, 10);
    const toStr = endDate.toISOString().slice(0, 10);

    // Targets custom del user
    const goal = await prisma.nutritionGoal.findUnique({ where: { userId } });
    const custom =
      (goal?.customTargets as Record<string, number> | null) ?? null;
    const targets: Record<string, number> = { ...DEFAULT_DV, ...(custom ?? {}) };

    // Cuántos días distintos loggeó el user en el rango (para promedio justo)
    const distinctDates = await prisma.mealLog.findMany({
      where: { userId, date: { gte: fromStr, lte: toStr } },
      select: { date: true },
      distinct: ["date"],
    });
    const loggedDays = Math.max(1, distinctDates.length);

    // Todos los items del rango
    const items = await prisma.mealItem.findMany({
      where: {
        mealLog: { userId, date: { gte: fromStr, lte: toStr } },
      },
      include: { foodItem: true },
    });

    const reports: NutrientReport[] = [];

    for (const nut of TRACKED_NUTRIENTS) {
      // Acumulador por foodItemId para calcular top sources
      const byFood: Record<
        string,
        {
          amount: number;
          name: string;
          brand: string | null;
        }
      > = {};
      let totalAmount = 0;

      for (const it of items as unknown as NutrientRowDb[]) {
        const food = it.foodItem as Record<string, unknown>;
        const raw = food[nut];
        const base = (food.servingSize as number) ?? 0;
        if (typeof raw !== "number" || !Number.isFinite(raw) || base <= 0) {
          continue;
        }
        const amount = raw * (it.quantity / base);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        totalAmount += amount;
        const key = it.foodItemId;
        if (!byFood[key]) {
          byFood[key] = {
            amount: 0,
            name: (food.name as string) ?? "?",
            brand: (food.brand as string | null) ?? null,
          };
        }
        byFood[key].amount += amount;
      }

      const dailyAverage = totalAmount / loggedDays;
      if (totalAmount === 0) {
        reports.push({
          nutrient: nut,
          dailyAverage: 0,
          dailyTarget: targets[nut]!,
          pctDv: 0,
          classification: "deficient",
          topSources: [],
        });
        continue;
      }

      const target = targets[nut]!;
      const pctDv = Math.round((dailyAverage / target) * 100);
      const classification: NutrientReport["classification"] =
        pctDv < 50
          ? "deficient"
          : pctDv < 75
            ? "low"
            : pctDv <= 100
              ? "adequate"
              : pctDv <= 120
                ? "excess"
                : "very_high";

      // Top 5 sources
      const sources = Object.entries(byFood)
        .map(([id, v]) => ({
          foodItemId: id,
          name: v.name,
          brand: v.brand,
          amountPerDay: Math.round((v.amount / loggedDays) * 100) / 100,
          pctOfTotal: Math.round((v.amount / totalAmount) * 100),
        }))
        .sort((a, b) => b.amountPerDay - a.amountPerDay)
        .slice(0, 5);

      reports.push({
        nutrient: nut,
        dailyAverage: Math.round(dailyAverage * 100) / 100,
        dailyTarget: target,
        pctDv,
        classification,
        topSources: sources,
      });
    }

    return NextResponse.json({
      from: fromStr,
      to: toStr,
      days,
      loggedDays,
      customTargetsUsed: custom != null && Object.keys(custom).length > 0,
      reports,
    });
  });
}
