import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseJson, foodUpdateSchema } from "@/lib/validation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const food = await prisma.foodItem.findFirst({ where: { id, userId } });
    if (!food)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(food);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.foodItem.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, foodUpdateSchema);
    if (!parsed.ok) return parsed.response;

    // Solo incluimos campos que el cliente envió explícitamente. Esto evita
    // sobrescribir valores con nulls cuando solo se actualiza parcialmente.
    const d = parsed.data;
    const data: Record<string, unknown> = {};
    const simpleKeys = [
      "name", "brand", "category", "servingSize", "servingUnit", "barcode",
      "notes", "calories", "protein", "carbs", "fat", "fiber", "sugar",
      "sodium", "saturatedFat", "transFat", "monoFat", "polyFat", "omega3",
      "omega6", "cholesterol", "addedSugar", "potassium", "calcium", "iron",
      "magnesium", "zinc", "phosphorus", "vitaminA", "vitaminC", "vitaminD",
      "vitaminE", "vitaminK", "thiamin", "riboflavin", "niacin", "vitaminB6",
      "folate", "vitaminB12", "caffeine", "alcohol", "water",
      "glycemicIndex", "glycemicLoad", "netCarbs",
      "leucine", "isoleucine", "valine", "lysine", "methionine",
      "phenylalanine", "threonine", "tryptophan", "histidine",
    ] as const;
    for (const k of simpleKeys) {
      if (d[k] !== undefined) data[k] = d[k];
    }

    const updated = await prisma.foodItem.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const food = await prisma.foodItem.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!food)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.foodItem.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
