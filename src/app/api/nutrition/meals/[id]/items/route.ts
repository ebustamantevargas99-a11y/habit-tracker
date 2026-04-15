import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: mealLogId } = await params;

  // Verify meal belongs to user
  const meal = await prisma.mealLog.findFirst({ where: { id: mealLogId, userId: session.user.id } });
  if (!meal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Get food item to compute macros
  const food = await prisma.foodItem.findFirst({ where: { id: body.foodItemId, userId: session.user.id } });
  if (!food) return NextResponse.json({ error: "Food not found" }, { status: 404 });

  const ratio = (body.quantity ?? 1) / (food.servingSize / 100);
  const item = await prisma.mealItem.create({
    data: {
      mealLogId,
      foodItemId: body.foodItemId,
      quantity: body.quantity ?? 1,
      unit: body.unit ?? "serving",
      calories: food.calories * ratio,
      protein: food.protein * ratio,
      carbs: food.carbs * ratio,
      fat: food.fat * ratio,
    },
    include: { foodItem: true },
  });
  return NextResponse.json(item, { status: 201 });
}
