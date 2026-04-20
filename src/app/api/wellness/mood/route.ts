import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, moodCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10) || 30, 366);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const logs = await prisma.moodLog.findMany({
      where: {
        userId,
        date: { gte: cutoff.toISOString().split("T")[0] },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(logs);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, moodCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const targetDate = d.date ?? new Date().toISOString().split("T")[0];

    const log = await prisma.moodLog.upsert({
      where: { userId_date: { userId, date: targetDate } },
      create: {
        userId,
        date: targetDate,
        mood: d.mood,
        emotions: d.emotions ?? [],
        factors: d.factors ?? [],
        notes: d.notes ?? null,
      },
      update: {
        mood: d.mood,
        emotions: d.emotions ?? [],
        factors: d.factors ?? [],
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(log);
  });
}
