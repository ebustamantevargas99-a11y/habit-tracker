import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseJson, foodCreateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const foods = await prisma.foodItem.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      take: 500,
    });
    return NextResponse.json(foods);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, foodCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const food = await prisma.foodItem.create({
      data: {
        userId,
        name: d.name,
        brand: d.brand ?? null,
        servingSize: d.servingSize ?? 100,
        servingUnit: d.servingUnit ?? "g",
        calories: d.calories,
        protein: d.protein ?? 0,
        carbs: d.carbs ?? 0,
        fat: d.fat ?? 0,
        fiber: d.fiber ?? 0,
        sugar: d.sugar ?? 0,
        sodium: d.sodium ?? 0,
        isCustom: true,
      },
    });
    return NextResponse.json(food, { status: 201 });
  });
}
