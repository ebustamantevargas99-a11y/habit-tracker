import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, savingsGoalUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.savingsGoal.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    const parsed = await parseJson(req, savingsGoalUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const wasAchieved = existing.achieved;
    const willBeAchieved = d.achieved ?? false;

    const updated = await prisma.savingsGoal.update({
      where: { id: params.id },
      data: {
        ...("name" in d ? { name: d.name } : {}),
        ...("emoji" in d ? { emoji: d.emoji ?? null } : {}),
        ...("targetAmount" in d ? { targetAmount: d.targetAmount } : {}),
        ...("currentAmount" in d ? { currentAmount: d.currentAmount } : {}),
        ...("targetDate" in d ? { targetDate: d.targetDate ?? null } : {}),
        ...("priority" in d ? { priority: d.priority ?? null } : {}),
        ...("linkedAccountId" in d ? { linkedAccountId: d.linkedAccountId ?? null } : {}),
        ...("category" in d ? { category: d.category ?? null } : {}),
        ...("notes" in d ? { notes: d.notes ?? null } : {}),
        ...("achieved" in d ? { achieved: d.achieved } : {}),
        ...(!wasAchieved && willBeAchieved ? { achievedAt: new Date() } : {}),
      },
    });

    // Crear milestone al lograrlo
    if (!wasAchieved && willBeAchieved) {
      await prisma.milestone.create({
        data: {
          userId,
          date: new Date().toISOString().split("T")[0],
          type: "custom",
          title: `🎯 Meta lograda: ${updated.name}`,
          description: `$${updated.targetAmount.toLocaleString()}`,
          icon: updated.emoji ?? "🏆",
        },
      });
    }
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.savingsGoal.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    await prisma.savingsGoal.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
