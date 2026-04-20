import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, habitCreateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const habits = await prisma.habit.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(habits);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, habitCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const habit = await prisma.habit.create({
      data: {
        userId,
        name: d.name,
        icon: d.icon ?? "✅",
        category: d.category,
        timeOfDay: d.timeOfDay ?? "all",
        frequency: d.frequency ?? "daily",
        targetDays: d.targetDays ?? [0, 1, 2, 3, 4, 5, 6],
      },
    });
    return NextResponse.json(habit, { status: 201 });
  });
}
