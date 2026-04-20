import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, pomodoroCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const days = Math.min(
      parseInt(searchParams.get("days") ?? "7", 10) || 7,
      365
    );
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const sessions = await prisma.pomodoroSession.findMany({
      where: { userId, date: { gte: cutoff.toISOString().split("T")[0] } },
      orderBy: { completedAt: "desc" },
    });
    return NextResponse.json(sessions);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, pomodoroCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const s = await prisma.pomodoroSession.create({
      data: {
        userId,
        date: d.date ?? new Date().toISOString().split("T")[0],
        task: d.task ?? null,
        duration: d.duration,
        isWork: d.isWork ?? true,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(s, { status: 201 });
  });
}
