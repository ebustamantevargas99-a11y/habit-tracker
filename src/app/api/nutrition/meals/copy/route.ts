import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";
import { z } from "zod";

const copyMealSchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
});

/**
 * Copia todos los MealLogs de fromDate a toDate. Si `mealType` se provee,
 * solo copia ese tipo (útil para "copiar desayuno de ayer" sin duplicar
 * comida y cena).
 *
 * Si el user ya tiene meals en toDate del mismo tipo, el endpoint los
 * deja intactos y añade NUEVO mealLog para no destruir data. (Cronometer
 * funciona igual — nunca machaca.)
 */
export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, copyMealSchema);
    if (!parsed.ok) return parsed.response;
    const { fromDate, toDate, mealType } = parsed.data;

    const sourceMeals = await prisma.mealLog.findMany({
      where: {
        userId,
        date: fromDate,
        ...(mealType ? { mealType } : {}),
      },
      include: { items: true },
    });

    if (sourceMeals.length === 0) {
      return NextResponse.json(
        { error: "No hay comidas para copiar en esa fecha" },
        { status: 404 },
      );
    }

    // Validar ownership de los foodItems referenciados (por seguridad ante
    // cualquier corrupción histórica)
    const allFoodIds = Array.from(
      new Set(sourceMeals.flatMap((m) => m.items.map((i) => i.foodItemId))),
    );
    if (allFoodIds.length > 0) {
      const owned = await prisma.foodItem.findMany({
        where: { id: { in: allFoodIds }, userId },
        select: { id: true },
      });
      if (owned.length !== allFoodIds.length) {
        return NextResponse.json(
          { error: "Datos inconsistentes" },
          { status: 400 },
        );
      }
    }

    const created = await prisma.$transaction(
      sourceMeals.map((src) =>
        prisma.mealLog.create({
          data: {
            userId,
            date: toDate,
            mealType: src.mealType,
            name: src.name ? `${src.name} (copia)` : null,
            notes: src.notes,
            items: {
              create: src.items.map((it) => ({
                foodItemId: it.foodItemId,
                quantity: it.quantity,
                unit: it.unit,
                calories: it.calories,
                protein: it.protein,
                carbs: it.carbs,
                fat: it.fat,
              })),
            },
          },
          include: { items: { include: { foodItem: true } } },
        }),
      ),
    );

    return NextResponse.json({
      copied: created.length,
      totalItems: created.reduce((s, m) => s + m.items.length, 0),
      meals: created,
    });
  });
}
