import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, savingsGoalCreateSchema } from "@/lib/validation";

export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: [{ achieved: "asc" }, { priority: "desc" }, { targetDate: "asc" }],
    });
    return NextResponse.json(goals);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, savingsGoalCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name: d.name,
        emoji: d.emoji ?? null,
        targetAmount: d.targetAmount,
        currentAmount: d.currentAmount ?? 0,
        targetDate: d.targetDate ?? null,
        priority: d.priority ?? null,
        linkedAccountId: d.linkedAccountId ?? null,
        category: d.category ?? null,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(goal, { status: 201 });
  });
}
