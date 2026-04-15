import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const reviews = await prisma.weeklyReview.findMany({
    where: { userId: session.user.id },
    orderBy: { weekStart: "desc" },
    take: limit,
  });
  return NextResponse.json(reviews);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const review = await prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId: session.user.id, weekStart: body.weekStart } },
    update: {
      wins: body.wins ?? [],
      challenges: body.challenges ?? [],
      learnings: body.learnings ?? [],
      nextWeekGoals: body.nextWeekGoals ?? [],
      gratitude: body.gratitude ?? [],
      overallRating: body.overallRating ?? 5,
      energyLevel: body.energyLevel ?? 5,
      productivityScore: body.productivityScore ?? 5,
      notes: body.notes ?? null,
    },
    create: {
      userId: session.user.id,
      weekStart: body.weekStart,
      wins: body.wins ?? [],
      challenges: body.challenges ?? [],
      learnings: body.learnings ?? [],
      nextWeekGoals: body.nextWeekGoals ?? [],
      gratitude: body.gratitude ?? [],
      overallRating: body.overallRating ?? 5,
      energyLevel: body.energyLevel ?? 5,
      productivityScore: body.productivityScore ?? 5,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(review, { status: 201 });
}
