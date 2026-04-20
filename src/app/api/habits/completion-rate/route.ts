import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/habits/completion-rate?days=30
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const logs = await prisma.habitLog.findMany({
    where: { userId: userId, date: { gte: cutoffStr } },
    select: { completed: true },
  });

  if (logs.length === 0) return NextResponse.json({ rate: 0 });

  const completed = logs.filter((l) => l.completed).length;
  const rate = Math.round((completed / logs.length) * 100);

  return NextResponse.json({ rate });
});
}
