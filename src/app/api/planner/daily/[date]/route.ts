import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { date: string } }
) {
  return withAuth(async (userId) => {

  const plan = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId: userId, date: params.date } },
    include: { timeBlocks: { orderBy: { startTime: "asc" } } },
  });

  // Return empty plan shape if not found
  if (!plan) {
    return NextResponse.json({
      date: params.date,
      topPriorities: [],
      timeBlocks: [],
      rating: null,
      notes: null,
    });
  }

  return NextResponse.json(plan);
});
}

// PUT replaces the entire plan (priorities + time blocks)
export async function PUT(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  return withAuth(async (userId) => {

  const body = await req.json();
  const { topPriorities, timeBlocks, rating, notes } = body;

  // Upsert the daily plan, replacing all time blocks
  const plan = await prisma.dailyPlan.upsert({
    where: { userId_date: { userId: userId, date: params.date } },
    create: {
      userId: userId,
      date: params.date,
      topPriorities: topPriorities ?? [],
      rating: rating ?? null,
      notes: notes ?? null,
      timeBlocks: {
        create: (timeBlocks ?? []).map(
          (b: { startTime: string; endTime: string; title: string; category?: string; completed?: boolean }) => ({
            startTime: b.startTime,
            endTime: b.endTime,
            title: b.title,
            category: b.category ?? null,
            completed: b.completed ?? false,
          })
        ),
      },
    },
    update: {
      topPriorities: topPriorities ?? [],
      rating: rating ?? null,
      notes: notes ?? null,
      timeBlocks: {
        deleteMany: {},
        create: (timeBlocks ?? []).map(
          (b: { startTime: string; endTime: string; title: string; category?: string; completed?: boolean }) => ({
            startTime: b.startTime,
            endTime: b.endTime,
            title: b.title,
            category: b.category ?? null,
            completed: b.completed ?? false,
          })
        ),
      },
    },
    include: { timeBlocks: { orderBy: { startTime: "asc" } } },
  });

  return NextResponse.json(plan);
});
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  return withAuth(async (userId) => {

  const body = await req.json();

  const plan = await prisma.dailyPlan.upsert({
    where: { userId_date: { userId: userId, date: params.date } },
    create: {
      userId: userId,
      date: params.date,
      topPriorities: [],
      rating: body.rating ?? null,
      notes: body.notes ?? null,
    },
    update: {
      ...(body.rating !== undefined && { rating: body.rating }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: { timeBlocks: true },
  });

  return NextResponse.json(plan);
});
}
