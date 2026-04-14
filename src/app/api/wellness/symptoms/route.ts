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

  const logs = await prisma.symptomLog.findMany({
    where: { userId: session.user.id, date: { gte: cutoff.toISOString().split("T")[0] } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { symptom, intensity, duration, notes, date } = await req.json();
  if (!symptom?.trim()) return NextResponse.json({ error: "symptom es requerido" }, { status: 400 });

  const log = await prisma.symptomLog.create({
    data: {
      userId: session.user.id,
      date: date ?? new Date().toISOString().split("T")[0],
      symptom: symptom.trim(),
      intensity: parseInt(intensity ?? 5),
      duration: duration ?? null,
      notes: notes?.trim() ?? null,
    },
  });
  return NextResponse.json(log, { status: 201 });
}
