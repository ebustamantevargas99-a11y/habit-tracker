import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Metric types we store individually, returned as grouped BodyMetric objects
const BODY_METRIC_FIELDS = [
  "weight", "bodyFat", "chest", "waist", "hips",
  "armLeft", "armRight", "thighLeft", "thighRight",
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const days = parseInt(searchParams.get("days") ?? "90");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const where: Record<string, unknown> = {
    userId: session.user.id,
    date: { gte: cutoff.toISOString().split("T")[0] },
  };
  if (type) where.type = type;

  const rows = await prisma.bodyMetric.findMany({
    where,
    orderBy: { date: "desc" },
  });

  // If fetching all types, group by date into BodyMetric objects
  if (!type) {
    const byDate = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      if (!byDate.has(row.date)) byDate.set(row.date, { date: row.date });
      byDate.get(row.date)![row.type] = row.value;
    }
    return NextResponse.json(
      Array.from(byDate.values()).sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
      )
    );
  }

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const date: string = body.date ?? new Date().toISOString().split("T")[0];

  // Accept either a single metric { type, value, unit } or a grouped object
  if (body.type && body.value !== undefined) {
    // Single metric
    const metric = await prisma.bodyMetric.create({
      data: {
        userId: session.user.id,
        date,
        type: body.type,
        value: parseFloat(body.value),
        unit: body.unit ?? "kg",
        method: body.method ?? null,
      },
    });
    return NextResponse.json(metric, { status: 201 });
  }

  // Grouped object { date, weight, bodyFat, ... }
  const created = await Promise.all(
    BODY_METRIC_FIELDS
      .filter((field) => body[field] !== undefined && body[field] !== null)
      .map((field) =>
        prisma.bodyMetric.create({
          data: {
            userId: session.user.id,
            date,
            type: field,
            value: parseFloat(body[field]),
            unit: field === "bodyFat" ? "%" : "cm",
          },
        })
      )
  );

  return NextResponse.json(created, { status: 201 });
}
