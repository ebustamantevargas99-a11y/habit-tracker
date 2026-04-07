import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(habits);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, icon, category, timeOfDay, frequency, targetDays } = body;

  if (!name || !category) {
    return NextResponse.json(
      { error: "Nombre y categoría son requeridos" },
      { status: 400 }
    );
  }

  const habit = await prisma.habit.create({
    data: {
      userId: session.user.id,
      name,
      icon: icon ?? "✅",
      category,
      timeOfDay: timeOfDay ?? "all",
      frequency: frequency ?? "daily",
      targetDays: targetDays ?? [0, 1, 2, 3, 4, 5, 6],
    },
  });

  return NextResponse.json(habit, { status: 201 });
}
