import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const logs = await prisma.medicationLog.findMany({
    where: { medicationId: params.id, userId: session.user.id, date: { gte: cutoff.toISOString().split("T")[0] } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { date, taken, notes } = await req.json();
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  const log = await prisma.medicationLog.upsert({
    where: { medicationId_date: { medicationId: params.id, date: targetDate } },
    create: { userId: session.user.id, medicationId: params.id, date: targetDate, taken: taken ?? false, takenAt: taken ? new Date() : null, notes: notes ?? null },
    update: { taken: taken ?? false, takenAt: taken ? new Date() : null, notes: notes ?? null },
  });
  return NextResponse.json(log);
}
