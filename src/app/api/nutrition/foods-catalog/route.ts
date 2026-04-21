import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import {
  FOODS_SEED,
  CATEGORY_LABELS,
  searchFoods,
  type FoodCategory,
} from "@/lib/nutrition/foods-seed";

// GET /api/nutrition/foods-catalog?q=pollo&category=protein&limit=50
// Combina seed de 100+ alimentos + custom del usuario.
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") ?? "").trim();
    const category = searchParams.get("category") as FoodCategory | null;
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50", 10) || 50,
      200
    );

    const seed = (query ? searchFoods(query, 200) : FOODS_SEED)
      .filter((f) => (category ? f.category === category : true))
      .slice(0, limit)
      .map((f) => ({
        id: `seed:${f.slug}`,
        slug: f.slug,
        name: f.name,
        brand: f.brand ?? null,
        category: f.category,
        categoryLabel: CATEGORY_LABELS[f.category],
        servingSize: f.servingSize,
        servingUnit: f.servingUnit,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        fiber: f.fiber,
        sugar: f.sugar,
        sodium: f.sodium,
        tags: f.tags ?? [],
        isCustom: false,
        source: "seed" as const,
      }));

    const custom = await prisma.foodItem.findMany({
      where: {
        userId,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { brand: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    const customMapped = custom.map((f) => ({
      id: f.id,
      slug: null as string | null,
      name: f.name,
      brand: f.brand,
      category: "processed" as FoodCategory,
      categoryLabel: "Custom",
      servingSize: f.servingSize,
      servingUnit: f.servingUnit,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      fiber: f.fiber,
      sugar: f.sugar,
      sodium: f.sodium,
      tags: [] as string[],
      isCustom: true,
      source: "user" as const,
    }));

    return NextResponse.json({
      foods: [...customMapped, ...seed],
      total: custom.length + seed.length,
    });
  });
}
