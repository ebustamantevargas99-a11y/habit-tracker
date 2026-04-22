import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, recipeUpdateSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const recipe = await prisma.recipe.findFirst({
      where: { id, userId },
      include: { items: { include: { foodItem: true } } },
    });
    if (!recipe)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(recipe);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.recipe.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, recipeUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Si viene `items`, validamos ownership de cada foodItem y
    // reemplazamos toda la lista de ingredientes (delete + create).
    if (d.items) {
      const foodIds = d.items.map((i) => i.foodItemId);
      const owned = await prisma.foodItem.findMany({
        where: { id: { in: foodIds }, userId },
        select: { id: true },
      });
      if (owned.length !== foodIds.length) {
        return NextResponse.json(
          { error: "Alimento inválido" },
          { status: 400 },
        );
      }
    }

    const recipe = await prisma.$transaction(async (tx) => {
      const updateData: {
        name?: string;
        description?: string | null;
        servings?: number;
      } = {};
      if (d.name !== undefined) updateData.name = d.name;
      if (d.description !== undefined)
        updateData.description = d.description ?? null;
      if (d.servings !== undefined) updateData.servings = d.servings;

      if (Object.keys(updateData).length > 0) {
        await tx.recipe.update({ where: { id }, data: updateData });
      }

      if (d.items) {
        await tx.recipeItem.deleteMany({ where: { recipeId: id } });
        await tx.recipeItem.createMany({
          data: d.items.map((i) => ({
            recipeId: id,
            foodItemId: i.foodItemId,
            quantity: i.quantity,
            unit: i.unit ?? "g",
          })),
        });
      }

      return tx.recipe.findUniqueOrThrow({
        where: { id },
        include: { items: { include: { foodItem: true } } },
      });
    });

    return NextResponse.json(recipe);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.recipe.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await prisma.recipe.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
