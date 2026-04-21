import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, emergencyCardUpsertSchema } from "@/lib/validation";

export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const card = await prisma.emergencyCard.findUnique({ where: { userId } });
    return NextResponse.json(card);
  });
}

export async function PUT(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, emergencyCardUpsertSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const card = await prisma.emergencyCard.upsert({
      where: { userId },
      create: {
        userId,
        bloodType: d.bloodType ?? null,
        allergies: d.allergies ?? [],
        conditions: d.conditions ?? [],
        medications: d.medications ?? [],
        emergencyName: d.emergencyName ?? null,
        emergencyPhone: d.emergencyPhone ?? null,
        emergencyRelation: d.emergencyRelation ?? null,
        notes: d.notes ?? null,
      },
      update: {
        ...(d.bloodType !== undefined ? { bloodType: d.bloodType } : {}),
        ...(d.allergies !== undefined ? { allergies: d.allergies } : {}),
        ...(d.conditions !== undefined ? { conditions: d.conditions } : {}),
        ...(d.medications !== undefined ? { medications: d.medications } : {}),
        ...(d.emergencyName !== undefined ? { emergencyName: d.emergencyName } : {}),
        ...(d.emergencyPhone !== undefined ? { emergencyPhone: d.emergencyPhone } : {}),
        ...(d.emergencyRelation !== undefined ? { emergencyRelation: d.emergencyRelation } : {}),
        ...(d.notes !== undefined ? { notes: d.notes } : {}),
      },
    });
    return NextResponse.json(card);
  });
}
