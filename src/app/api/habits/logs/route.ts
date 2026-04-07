import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/habits/logs?days=90
// Returns all logs for all habits of the current user within the date range
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "90");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const logs = await prisma.habitLog.findMany({
    where: {
      userId: session.user.id,
      date: { gte: cutoffStr },
    },
    orderBy: { date: "desc" },
    select: { id: true, habitId: true, date: true, completed: true, notes: true },
  });

  return NextResponse.json(logs);
}
