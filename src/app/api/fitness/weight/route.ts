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

  const rows = await prisma.bodyMetric.findMany({
    where: {
      userId: session.user.id,
      type: "weight",
      date: { gte: cutoff.toISOString().split("T")[0] },
    },
    orderBy: { date: "asc" },
    select: { date: true, value: true },
  });

  return NextResponse.json(rows.map((r) => ({ date: r.date, weight: r.value })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { date, weight } = await req.json();

  if (!date || weight === undefined) {
    return NextResponse.json({ error: "date y weight son requeridos" }, { status: 400 });
  }

  const metric = await prisma.bodyMetric.create({
    data: {
      userId: session.user.id,
      date,
      type: "weight",
      value: parseFloat(weight),
      unit: "kg",
    },
  });

  return NextResponse.json({ date: metric.date, weight: metric.value }, { status: 201 });
}
