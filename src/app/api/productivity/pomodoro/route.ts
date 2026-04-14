import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "7");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const sessions = await prisma.pomodoroSession.findMany({
    where: { userId: session.user.id, date: { gte: cutoff.toISOString().split("T")[0] } },
    orderBy: { completedAt: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { task, duration, isWork, notes, date } = await req.json();
  if (!duration) return NextResponse.json({ error: "duration es requerido" }, { status: 400 });

  const s = await prisma.pomodoroSession.create({
    data: {
      userId: session.user.id,
      date: date ?? new Date().toISOString().split("T")[0],
      task: task?.trim() ?? null,
      duration: parseInt(duration),
      isWork: isWork ?? true,
      notes: notes?.trim() ?? null,
    },
  });
  return NextResponse.json(s, { status: 201 });
}
