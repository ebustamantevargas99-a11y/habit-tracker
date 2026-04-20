import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseJson, mealCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const date =
      searchParams.get("date") ?? new Date().toISOString().split("T")[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "date debe ser YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const meals = await prisma.mealLog.findMany({
      where: { userId, date },
      include: { items: { include: { foodItem: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(meals);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, mealCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const meal = await prisma.mealLog.create({
      data: {
        userId,
        date: d.date ?? new Date().toISOString().split("T")[0],
        mealType: d.mealType,
        name: d.name ?? null,
        notes: d.notes ?? null,
      },
      include: { items: { include: { foodItem: true } } },
    });
    return NextResponse.json(meal, { status: 201 });
  });
}
