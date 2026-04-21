import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, mealTemplateUseSchema } from "@/lib/validation";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.mealTemplate.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await prisma.mealTemplate.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}

// POST = aplicar el template a un mealLog (copia items con macros calculados)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const template = await prisma.mealTemplate.findFirst({
      where: { id, userId },
      include: { items: { include: { foodItem: true } } },
    });
    if (!template) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, mealTemplateUseSchema);
    if (!parsed.ok) return parsed.response;
    const { mealLogId } = parsed.data;

    const meal = await prisma.mealLog.findFirst({
      where: { id: mealLogId, userId },
      select: { id: true },
    });
    if (!meal) return NextResponse.json({ error: "Meal inválido" }, { status: 404 });

    const created = await prisma.$transaction(
      template.items.map((tItem) => {
        const food = tItem.foodItem;
        const ratio = food.servingSize > 0 ? tItem.quantity / food.servingSize : 1;
        return prisma.mealItem.create({
          data: {
            mealLogId,
            foodItemId: food.id,
            quantity: tItem.quantity,
            unit: tItem.unit,
            calories: food.calories * ratio,
            protein: food.protein * ratio,
            carbs: food.carbs * ratio,
            fat: food.fat * ratio,
          },
          include: { foodItem: true },
        });
      })
    );
    return NextResponse.json({ items: created }, { status: 201 });
  });
}
