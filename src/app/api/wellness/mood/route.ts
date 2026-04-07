import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const logs = await prisma.moodLog.findMany({
    where: {
      userId: session.user.id,
      date: { gte: cutoff.toISOString().split("T")[0] },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { mood, emotions, factors, notes, date } = body;
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  if (mood === undefined) {
    return NextResponse.json({ error: "mood es requerido" }, { status: 400 });
  }

  const log = await prisma.moodLog.upsert({
    where: { userId_date: { userId: session.user.id, date: targetDate } },
    create: {
      userId: session.user.id,
      date: targetDate,
      mood: parseInt(mood),
      emotions: emotions ?? [],
      factors: factors ?? [],
      notes: notes ?? null,
    },
    update: {
      mood: parseInt(mood),
      emotions: emotions ?? [],
      factors: factors ?? [],
      notes: notes ?? null,
    },
  });

  return NextResponse.json(log);
}
