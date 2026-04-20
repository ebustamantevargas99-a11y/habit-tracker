import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseJson, mealItemCreateSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id: mealLogId } = await params;

    const meal = await prisma.mealLog.findFirst({
      where: { id: mealLogId, userId },
      select: { id: true },
    });
    if (!meal)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, mealItemCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const food = await prisma.foodItem.findFirst({
      where: { id: d.foodItemId, userId },
    });
    if (!food)
      return NextResponse.json({ error: "Alimento no encontrado" }, { status: 404 });

    const quantity = d.quantity ?? 1;
    const ratio = quantity / (food.servingSize / 100);
    const item = await prisma.mealItem.create({
      data: {
        mealLogId,
        foodItemId: d.foodItemId,
        quantity,
        unit: d.unit ?? "serving",
        calories: food.calories * ratio,
        protein: food.protein * ratio,
        carbs: food.carbs * ratio,
        fat: food.fat * ratio,
      },
      include: { foodItem: true },
    });
    return NextResponse.json(item, { status: 201 });
  });
}
