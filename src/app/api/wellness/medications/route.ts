import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const meds = await prisma.medication.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { supplementFacts: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(meds);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, brand, dosage, frequency, timeOfDay, supplementFacts } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name es requerido" }, { status: 400 });

  const med = await prisma.medication.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      brand: brand?.trim() ?? null,
      dosage: dosage?.trim() ?? null,
      frequency: frequency ?? "daily",
      timeOfDay: timeOfDay ?? null,
      supplementFacts: supplementFacts?.length
        ? { create: supplementFacts.map((sf: { nutrient: string; amount: string; dailyValuePct?: string }) => ({
            nutrient: sf.nutrient,
            amount: sf.amount,
            dailyValuePct: sf.dailyValuePct ?? null,
          })) }
        : undefined,
    },
    include: { supplementFacts: true },
  });
  return NextResponse.json(med, { status: 201 });
}
