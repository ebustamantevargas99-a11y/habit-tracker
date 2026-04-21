import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, meditationCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "60", 10)));
    const sessions = await prisma.meditationSession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: limit,
    });
    return NextResponse.json(sessions);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, meditationCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const session = await prisma.meditationSession.create({
      data: {
        userId,
        date: d.date ?? new Date().toISOString().split("T")[0],
        durationMinutes: d.durationMinutes,
        type: d.type ?? "mindfulness",
        moodBefore: d.moodBefore ?? null,
        moodAfter: d.moodAfter ?? null,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(session, { status: 201 });
  });
}
