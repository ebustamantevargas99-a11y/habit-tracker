import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

/**
 * Quick-add helper — provee tres listas rápidas para Hoy hub:
 *
 *   - frequent:    top 10 foods más registrados en los últimos 60 días
 *                  (count DESC). Equivalente a "Favoritos" de Cronometer.
 *   - recent:      últimos 10 foods únicos usados (order DESC de última
 *                  vez que aparecieron en un meal).
 *   - yesterdayByMeal: los items de ayer agrupados por mealType (bfast/
 *                  lunch/dinner/snack). Permite "Copiar desayuno de ayer".
 *
 * Un solo endpoint reduce 3 requests a 1 en el Hoy hub.
 */

interface QuickAddFood {
  foodItemId: string;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  count?: number;         // solo para frequent
  lastUsed?: string;      // solo para recent (fecha)
}

interface YesterdayMealItem {
  foodItemId: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
}

interface YesterdayGrouped {
  breakfast: YesterdayMealItem[];
  lunch: YesterdayMealItem[];
  dinner: YesterdayMealItem[];
  snack: YesterdayMealItem[];
}

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const tz = searchParams.get("tz") || undefined;

    // Calcula YYYY-MM-DD para "hoy" y "ayer" en la tz del user
    const today = formatLocalDate(new Date(), tz);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = formatLocalDate(yesterdayDate, tz);
    const sixtyDaysAgoDate = new Date();
    sixtyDaysAgoDate.setDate(sixtyDaysAgoDate.getDate() - 60);
    const sixtyDaysAgo = formatLocalDate(sixtyDaysAgoDate, tz);

    // ─── Frequent (más usados últimos 60 días) ────────────────────────────
    const frequentGrouped = await prisma.mealItem.groupBy({
      by: ["foodItemId"],
      where: {
        mealLog: { userId, date: { gte: sixtyDaysAgo } },
      },
      _count: { foodItemId: true },
      orderBy: { _count: { foodItemId: "desc" } },
      take: 10,
    });
    const frequentIds = frequentGrouped.map((g) => g.foodItemId);
    const frequentFoods =
      frequentIds.length > 0
        ? await prisma.foodItem.findMany({
            where: { id: { in: frequentIds }, userId },
          })
        : [];
    const frequentById = new Map(frequentFoods.map((f) => [f.id, f]));
    const frequent: QuickAddFood[] = [];
    for (const g of frequentGrouped) {
      const f = frequentById.get(g.foodItemId);
      if (!f) continue;
      frequent.push({
        foodItemId: f.id,
        name: f.name,
        brand: f.brand,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        servingSize: f.servingSize,
        servingUnit: f.servingUnit,
        count: g._count.foodItemId,
      });
    }

    // ─── Recent (últimos 10 únicos usados) ────────────────────────────────
    // Tomamos los últimos 60 MealItems, deduplicamos por foodItemId,
    // guardamos la fecha (del MealLog) como lastUsed.
    const recentItems = await prisma.mealItem.findMany({
      where: { mealLog: { userId } },
      orderBy: { mealLog: { date: "desc" } },
      take: 60,
      select: {
        foodItemId: true,
        mealLog: { select: { date: true } },
        foodItem: true,
      },
    });
    const seen = new Set<string>();
    const recent: QuickAddFood[] = [];
    for (const it of recentItems) {
      if (seen.has(it.foodItemId)) continue;
      seen.add(it.foodItemId);
      recent.push({
        foodItemId: it.foodItem.id,
        name: it.foodItem.name,
        brand: it.foodItem.brand,
        calories: it.foodItem.calories,
        protein: it.foodItem.protein,
        carbs: it.foodItem.carbs,
        fat: it.foodItem.fat,
        servingSize: it.foodItem.servingSize,
        servingUnit: it.foodItem.servingUnit,
        lastUsed: it.mealLog.date,
      });
      if (recent.length >= 10) break;
    }

    // ─── Yesterday by meal type ───────────────────────────────────────────
    const yesterdayMeals = await prisma.mealLog.findMany({
      where: { userId, date: yesterday },
      include: { items: { include: { foodItem: true } } },
    });

    const yesterdayGrouped: YesterdayGrouped = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const m of yesterdayMeals) {
      const key = (["breakfast", "lunch", "dinner", "snack"] as const).includes(
        m.mealType as "breakfast" | "lunch" | "dinner" | "snack",
      )
        ? (m.mealType as "breakfast" | "lunch" | "dinner" | "snack")
        : null;
      if (!key) continue;
      for (const it of m.items) {
        yesterdayGrouped[key].push({
          foodItemId: it.foodItemId,
          foodName: it.foodItem.name,
          quantity: it.quantity,
          unit: it.unit,
          calories: it.calories,
        });
      }
    }

    return NextResponse.json({
      today,
      yesterday,
      frequent,
      recent,
      yesterdayByMeal: yesterdayGrouped,
    });
  });
}

function formatLocalDate(d: Date, tz?: string): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
