import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, timelineMilestoneCreateSchema } from "@/lib/validation";

// GET = timeline combinado (milestones explícitos + auto-detectados)
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

    // 1. Milestones explícitos
    const milestones = await prisma.milestone.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: limit,
    });

    // 2. Auto-detectados (últimos 90 días):
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const [booksFinished, habitsWithStreak, workoutsPR] = await Promise.all([
      prisma.book.findMany({
        where: {
          userId,
          status: "finished",
          finishedAt: { gte: cutoffStr, not: null },
        },
        select: { title: true, finishedAt: true, author: true },
      }),
      prisma.habit.findMany({
        where: { userId, streakBest: { gte: 7 }, isActive: true },
        select: { name: true, icon: true, streakBest: true, updatedAt: true },
        take: 10,
        orderBy: { streakBest: "desc" },
      }),
      prisma.workout.findMany({
        where: {
          userId,
          date: { gte: cutoffStr },
          prsHit: { gt: 0 },
        },
        select: { date: true, prsHit: true, name: true },
      }),
    ]);

    type TLItem = {
      id: string;
      date: string;
      type: string;
      title: string;
      description?: string | null;
      icon?: string | null;
      auto: boolean;
    };

    const autoItems: TLItem[] = [
      ...booksFinished.map((b) => ({
        id: `book-${b.title}`,
        date: b.finishedAt!,
        type: "book_finished",
        title: `Terminaste ${b.title}`,
        description: b.author ?? null,
        icon: "📖",
        auto: true,
      })),
      ...habitsWithStreak.map((h) => ({
        id: `streak-${h.name}`,
        date: h.updatedAt.toISOString().split("T")[0],
        type: "habit_streak",
        title: `Mejor racha: ${h.streakBest} días`,
        description: h.name,
        icon: h.icon ?? "🔥",
        auto: true,
      })),
      ...workoutsPR.map((w) => ({
        id: `pr-${w.date}-${w.name}`,
        date: w.date,
        type: "pr",
        title: `${w.prsHit} PR nuevo${w.prsHit > 1 ? "s" : ""}`,
        description: w.name,
        icon: "🏋️",
        auto: true,
      })),
    ];

    const explicitItems: TLItem[] = milestones.map((m) => ({
      id: m.id,
      date: m.date,
      type: m.type,
      title: m.title,
      description: m.description,
      icon: m.icon,
      auto: false,
    }));

    const combined = [...explicitItems, ...autoItems]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);

    return NextResponse.json(combined);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, timelineMilestoneCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const milestone = await prisma.milestone.create({
      data: {
        userId,
        date: d.date ?? new Date().toISOString().split("T")[0],
        type: d.type,
        title: d.title,
        description: d.description ?? null,
        icon: d.icon ?? null,
      },
    });
    return NextResponse.json(milestone, { status: 201 });
  });
}
