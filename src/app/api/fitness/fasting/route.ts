import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const logs = await prisma.fastingLog.findMany({
    where: { userId: session.user.id },
    orderBy: { startTime: "desc" },
    take: limit,
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { startTime, endTime, targetHours, completed, notes } = await req.json();
  if (!startTime) return NextResponse.json({ error: "startTime es requerido" }, { status: 400 });

  const log = await prisma.fastingLog.create({
    data: {
      userId: session.user.id,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      targetHours: targetHours ?? 16,
      completed: completed ?? false,
      notes: notes?.trim() ?? null,
    },
  });
  return NextResponse.json(log, { status: 201 });
}
