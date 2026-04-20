import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/habits/heatmap?days=90
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "90");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const [logs, habitCount] = await Promise.all([
    prisma.habitLog.findMany({
      where: { userId: userId, date: { gte: cutoffStr } },
      select: { date: true, completed: true },
    }),
    prisma.habit.count({
      where: { userId: userId, isActive: true },
    }),
  ]);

  // Group logs by date
  const byDate = new Map<string, { completed: number; total: number }>();
  for (const log of logs) {
    const existing = byDate.get(log.date) ?? { completed: 0, total: habitCount };
    if (log.completed) existing.completed++;
    byDate.set(log.date, existing);
  }

  // Build heatmap array from oldest to newest
  const today = new Date();
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const entry = byDate.get(dateStr) ?? { completed: 0, total: habitCount };
    const ratio = entry.total > 0 ? entry.completed / entry.total : 0;
    const level =
      ratio >= 0.9 ? 4 : ratio >= 0.7 ? 3 : ratio >= 0.4 ? 2 : ratio > 0 ? 1 : 0;

    data.push({ date: dateStr, ...entry, level });
  }

  return NextResponse.json(data);
});
}
