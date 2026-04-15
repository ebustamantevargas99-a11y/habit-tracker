import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const meals = await prisma.mealLog.findMany({
    where: { userId: session.user.id, date },
    include: { items: { include: { foodItem: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(meals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const meal = await prisma.mealLog.create({
    data: {
      userId: session.user.id,
      date: body.date ?? new Date().toISOString().split("T")[0],
      mealType: body.mealType,
      name: body.name ?? null,
      notes: body.notes ?? null,
    },
    include: { items: { include: { foodItem: true } } },
  });
  return NextResponse.json(meal, { status: 201 });
}
