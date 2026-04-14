import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const logs = await prisma.hydrationLog.findMany({
    where: { userId: session.user.id, date: { gte: cutoffStr } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { date, amountMl, goalMl, notes } = await req.json();
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  const log = await prisma.hydrationLog.upsert({
    where: { userId_date: { userId: session.user.id, date: targetDate } },
    create: { userId: session.user.id, date: targetDate, amountMl: amountMl ?? 0, goalMl: goalMl ?? 2500, notes: notes ?? null },
    update: { amountMl: amountMl ?? 0, goalMl: goalMl ?? 2500, notes: notes ?? null },
  });
  return NextResponse.json(log);
}
