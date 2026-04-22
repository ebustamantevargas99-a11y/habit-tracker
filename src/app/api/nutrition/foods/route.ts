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
        category: d.category ?? null,
        servingSize: d.servingSize ?? 100,
        servingUnit: d.servingUnit ?? "g",
        barcode: d.barcode ?? null,
        notes: d.notes ?? null,
        // Macros principales (default 0 si vacío)
        calories: d.calories,
        protein: d.protein ?? 0,
        carbs: d.carbs ?? 0,
        fat: d.fat ?? 0,
        fiber: d.fiber ?? 0,
        sugar: d.sugar ?? 0,
        sodium: d.sodium ?? 0,
        // Desglose de macros (nullable — si usuario no sabe, queda NULL)
        saturatedFat: d.saturatedFat ?? null,
        transFat: d.transFat ?? null,
        monoFat: d.monoFat ?? null,
        polyFat: d.polyFat ?? null,
        omega3: d.omega3 ?? null,
        omega6: d.omega6 ?? null,
        cholesterol: d.cholesterol ?? null,
        addedSugar: d.addedSugar ?? null,
        // Minerales
        potassium: d.potassium ?? null,
        calcium: d.calcium ?? null,
        iron: d.iron ?? null,
        magnesium: d.magnesium ?? null,
        zinc: d.zinc ?? null,
        phosphorus: d.phosphorus ?? null,
        // Vitaminas
        vitaminA: d.vitaminA ?? null,
        vitaminC: d.vitaminC ?? null,
        vitaminD: d.vitaminD ?? null,
        vitaminE: d.vitaminE ?? null,
        vitaminK: d.vitaminK ?? null,
        thiamin: d.thiamin ?? null,
        riboflavin: d.riboflavin ?? null,
        niacin: d.niacin ?? null,
        vitaminB6: d.vitaminB6 ?? null,
        folate: d.folate ?? null,
        vitaminB12: d.vitaminB12 ?? null,
        // Glycemic + net carbs
        glycemicIndex: d.glycemicIndex ?? null,
        glycemicLoad: d.glycemicLoad ?? null,
        netCarbs: d.netCarbs ?? null,
        // Aminoácidos esenciales
        leucine: d.leucine ?? null,
        isoleucine: d.isoleucine ?? null,
        valine: d.valine ?? null,
        lysine: d.lysine ?? null,
        methionine: d.methionine ?? null,
        phenylalanine: d.phenylalanine ?? null,
        threonine: d.threonine ?? null,
        tryptophan: d.tryptophan ?? null,
        histidine: d.histidine ?? null,
        // Otros
        caffeine: d.caffeine ?? null,
        alcohol: d.alcohol ?? null,
        water: d.water ?? null,
        isCustom: true,
      },
    });
    return NextResponse.json(food, { status: 201 });
  });
}
