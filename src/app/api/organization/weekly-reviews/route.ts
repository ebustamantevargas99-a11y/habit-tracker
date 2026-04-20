import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseJson, weeklyReviewUpsertSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "10", 10) || 10,
      200
    );

    const reviews = await prisma.weeklyReview.findMany({
      where: { userId },
      orderBy: { weekStart: "desc" },
      take: limit,
    });
    return NextResponse.json(reviews);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, weeklyReviewUpsertSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const data = {
      wins: d.wins ?? [],
      challenges: d.challenges ?? [],
      learnings: d.learnings ?? [],
      nextWeekGoals: d.nextWeekGoals ?? [],
      gratitude: d.gratitude ?? [],
      overallRating: d.overallRating ?? 5,
      energyLevel: d.energyLevel ?? 5,
      productivityScore: d.productivityScore ?? 5,
      notes: d.notes ?? null,
    };

    const review = await prisma.weeklyReview.upsert({
      where: { userId_weekStart: { userId, weekStart: d.weekStart } },
      update: data,
      create: { userId, weekStart: d.weekStart, ...data },
    });
    return NextResponse.json(review, { status: 201 });
  });
}
