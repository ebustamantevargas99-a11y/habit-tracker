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

  const logs = await prisma.sleepLog.findMany({
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
  const { bedtime, wakeTime, quality, durationHours, dreamJournal, factors, date } = body;
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  if (!bedtime || !wakeTime || quality === undefined) {
    return NextResponse.json(
      { error: "bedtime, wakeTime y quality son requeridos" },
      { status: 400 }
    );
  }

  const log = await prisma.sleepLog.upsert({
    where: { userId_date: { userId: session.user.id, date: targetDate } },
    create: {
      userId: session.user.id,
      date: targetDate,
      bedtime,
      wakeTime,
      quality: parseInt(quality),
      durationHours: parseFloat(durationHours ?? 0),
      dreamJournal: dreamJournal ?? null,
      factors: factors ?? [],
    },
    update: {
      bedtime,
      wakeTime,
      quality: parseInt(quality),
      durationHours: parseFloat(durationHours ?? 0),
      dreamJournal: dreamJournal ?? null,
      factors: factors ?? [],
    },
  });

  return NextResponse.json(log);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  await prisma.sleepLog.deleteMany({
    where: { id, userId: session.user.id },
  });

  return new NextResponse(null, { status: 204 });
}
