import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

type OFFProduct = {
  product_name?: string;
  brands?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "proteins_100g"?: number;
    "carbohydrates_100g"?: number;
    "fat_100g"?: number;
    "fiber_100g"?: number;
    "sugars_100g"?: number;
    "sodium_100g"?: number;
    "salt_100g"?: number;
  };
  image_url?: string;
  serving_size?: string;
};

// GET /api/nutrition/barcode/[code]
// Busca primero en los foodItems del user (ya escaneados antes),
// y si no existe consulta OpenFoodFacts y crea uno nuevo.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  return withAuth(async (userId) => {
    const { code } = await params;
    const barcode = code.trim();
    if (!/^\d{8,20}$/.test(barcode)) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    // 1. Revisar si ya existe en los foodItems del user
    const existing = await prisma.foodItem.findFirst({
      where: { userId, barcode },
    });
    if (existing) return NextResponse.json({ food: existing, source: "local" });

    // 2. Consultar OpenFoodFacts v2 (público, sin auth)
    try {
      const resp = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,nutriments,image_url,serving_size`,
        { headers: { "User-Agent": "UltimateTracker/1.0" } }
      );
      if (!resp.ok) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }
      const data = (await resp.json()) as { status: number; product?: OFFProduct };
      if (data.status !== 1 || !data.product) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }

      const p = data.product;
      const n = p.nutriments ?? {};
      // Salt → sodium (mg): 1g salt = 400mg sodium
      const sodiumMg =
        n["sodium_100g"] !== undefined
          ? n["sodium_100g"] * 1000
          : n["salt_100g"] !== undefined
          ? n["salt_100g"] * 400
          : 0;

      // Crear el foodItem en la DB del user para próximas búsquedas
      const food = await prisma.foodItem.create({
        data: {
          userId,
          name: p.product_name?.slice(0, 200) ?? `Producto ${barcode}`,
          brand: p.brands?.slice(0, 200) ?? null,
          servingSize: 100,
          servingUnit: "g",
          calories: n["energy-kcal_100g"] ?? 0,
          protein: n["proteins_100g"] ?? 0,
          carbs: n["carbohydrates_100g"] ?? 0,
          fat: n["fat_100g"] ?? 0,
          fiber: n["fiber_100g"] ?? 0,
          sugar: n["sugars_100g"] ?? 0,
          sodium: sodiumMg,
          barcode,
          isCustom: true,
        },
      });
      return NextResponse.json({ food, source: "openfoodfacts" });
    } catch (err) {
      console.error("[barcode] OFF lookup failed:", err);
      return NextResponse.json(
        { error: "Error consultando OpenFoodFacts" },
        { status: 502 }
      );
    }
  });
}
