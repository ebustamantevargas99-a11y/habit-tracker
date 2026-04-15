import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goal = await prisma.nutritionGoal.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json(goal);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const goal = await prisma.nutritionGoal.upsert({
    where: { userId: session.user.id },
    update: {
      calories: body.calories,
      protein: body.protein,
      carbs: body.carbs,
      fat: body.fat,
      fiber: body.fiber,
      waterMl: body.waterMl,
      mealsPerDay: body.mealsPerDay,
    },
    create: {
      userId: session.user.id,
      calories: body.calories ?? 2000,
      protein: body.protein ?? 150,
      carbs: body.carbs ?? 200,
      fat: body.fat ?? 65,
      fiber: body.fiber ?? 25,
      waterMl: body.waterMl ?? 2500,
      mealsPerDay: body.mealsPerDay ?? 3,
    },
  });
  return NextResponse.json(goal);
}
