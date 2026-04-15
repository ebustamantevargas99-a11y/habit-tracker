import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const foods = await prisma.foodItem.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(foods);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const food = await prisma.foodItem.create({
    data: {
      userId: session.user.id,
      name: body.name,
      brand: body.brand ?? null,
      servingSize: body.servingSize ?? 100,
      servingUnit: body.servingUnit ?? "g",
      calories: body.calories,
      protein: body.protein ?? 0,
      carbs: body.carbs ?? 0,
      fat: body.fat ?? 0,
      fiber: body.fiber ?? 0,
      sugar: body.sugar ?? 0,
      sodium: body.sodium ?? 0,
      isCustom: true,
    },
  });
  return NextResponse.json(food, { status: 201 });
}
