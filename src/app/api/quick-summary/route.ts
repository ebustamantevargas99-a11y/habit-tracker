import { NextRequest, NextResponse } from "next/server";
import { withApiKeyAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { todayLocal } from "@/lib/date/local";

export async function GET(req: NextRequest) {
  return withApiKeyAuth(req, async (userId) => {
    // Use the user's configured timezone so "today" matches their local date,
    // not the server's UTC date (which can be off by one day in the evening).
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    const today = todayLocal(profile?.timezone);

    const [hydration, habits, habitLogs, latestWeight, todayExpenses] =
      await Promise.all([
        prisma.hydrationLog.findUnique({
          where: { userId_date: { userId, date: today } },
          select: { amountMl: true, goalMl: true },
        }),
        prisma.habit.findMany({
          where: { userId, isActive: true },
          select: { id: true, name: true, icon: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.habitLog.findMany({
          where: { userId, date: today, completed: true },
          select: { habitId: true },
        }),
        prisma.bodyMetric.findFirst({
          where: { userId, type: "weight" },
          orderBy: { date: "desc" },
          select: { value: true, unit: true, date: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, date: today, type: "expense" },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

    const completedIds = new Set(habitLogs.map((l) => l.habitId));

    return NextResponse.json({
      date: today,
      water: {
        amountMl: hydration?.amountMl ?? 0,
        goalMl: hydration?.goalMl ?? 2500,
        glasses: Math.floor((hydration?.amountMl ?? 0) / 250),
        goalGlasses: Math.floor((hydration?.goalMl ?? 2500) / 250),
      },
      habits: {
        total: habits.length,
        completed: completedIds.size,
        items: habits.map((h) => ({
          id: h.id,
          name: h.name,
          icon: h.icon,
          done: completedIds.has(h.id),
        })),
      },
      weight: latestWeight
        ? {
            value: latestWeight.value,
            unit: latestWeight.unit,
            date: latestWeight.date,
          }
        : null,
      expenses: {
        total: todayExpenses._sum.amount ?? 0,
        count: todayExpenses._count,
      },
    });
  });
}
