import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, medicationCreateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const meds = await prisma.medication.findMany({
      where: { userId, isActive: true },
      include: { supplementFacts: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(meds);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, medicationCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const med = await prisma.medication.create({
      data: {
        userId,
        name: d.name,
        brand: d.brand ?? null,
        dosage: d.dosage ?? null,
        frequency: d.frequency ?? "daily",
        timeOfDay: d.timeOfDay ?? null,
        supplementFacts: d.supplementFacts?.length
          ? {
              create: d.supplementFacts.map((sf) => ({
                nutrient: sf.nutrient,
                amount: sf.amount,
                dailyValuePct: sf.dailyValuePct ?? null,
              })),
            }
          : undefined,
      },
      include: { supplementFacts: true },
    });
    return NextResponse.json(med, { status: 201 });
  });
}
