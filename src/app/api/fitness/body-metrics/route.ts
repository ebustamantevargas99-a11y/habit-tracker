import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, bodyMetricInputSchema } from "@/lib/validation";

const BODY_METRIC_FIELDS = [
  "weight",
  "bodyFat",
  "chest",
  "waist",
  "hips",
  "armLeft",
  "armRight",
  "thighLeft",
  "thighRight",
] as const;

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const days = Math.min(parseInt(searchParams.get("days") ?? "90", 10) || 90, 730);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const where: Record<string, unknown> = {
      userId,
      date: { gte: cutoff.toISOString().split("T")[0] },
    };
    if (type) where.type = type;

    const rows = await prisma.bodyMetric.findMany({
      where,
      orderBy: { date: "desc" },
    });

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
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, bodyMetricInputSchema);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data as Record<string, unknown>;
    const date: string =
      (body.date as string) ?? new Date().toISOString().split("T")[0];

    if ("type" in body && "value" in body) {
      const metric = await prisma.bodyMetric.create({
        data: {
          userId,
          date,
          type: body.type as string,
          value: body.value as number,
          unit: (body.unit as string) ?? "kg",
          method: (body.method as string | null) ?? null,
        },
      });
      return NextResponse.json(metric, { status: 201 });
    }

    const created = await Promise.all(
      BODY_METRIC_FIELDS.filter(
        (field) => body[field] !== undefined && body[field] !== null
      ).map((field) =>
        prisma.bodyMetric.create({
          data: {
            userId,
            date,
            type: field,
            value: body[field] as number,
            unit: field === "bodyFat" ? "%" : "cm",
          },
        })
      )
    );

    return NextResponse.json(created, { status: 201 });
  });
}
