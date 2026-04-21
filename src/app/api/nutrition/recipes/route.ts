import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, recipeCreateSchema } from "@/lib/validation";

export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const recipes = await prisma.recipe.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { items: { include: { foodItem: true } } },
    });
    return NextResponse.json(recipes);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, recipeCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const foodIds = d.items.map((i) => i.foodItemId);
    const ownedFoods = await prisma.foodItem.findMany({
      where: { id: { in: foodIds }, userId },
      select: { id: true },
    });
    if (ownedFoods.length !== foodIds.length) {
      return NextResponse.json({ error: "Alimento inválido" }, { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: {
        userId,
        name: d.name,
        description: d.description ?? null,
        servings: d.servings ?? 1,
        items: {
          create: d.items.map((i) => ({
            foodItemId: i.foodItemId,
            quantity: i.quantity,
            unit: i.unit ?? "g",
          })),
        },
      },
      include: { items: { include: { foodItem: true } } },
    });
    return NextResponse.json(recipe, { status: 201 });
  });
}
