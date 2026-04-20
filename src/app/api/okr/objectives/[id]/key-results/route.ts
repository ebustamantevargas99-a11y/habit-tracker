import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, keyResultCreateSchema } from "@/lib/validation";
import { z } from "zod";

const keyResultPatchSchema = z.object({
  krId: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(300).optional(),
  targetValue: z.number().finite().nonnegative().max(1_000_000_000).optional(),
  currentValue: z.number().finite().nonnegative().max(1_000_000_000).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const objective = await prisma.oKRObjective.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!objective)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const krs = await prisma.oKRKeyResult.findMany({
      where: { objectiveId: params.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(krs);
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const objective = await prisma.oKRObjective.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!objective)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, keyResultCreateSchema);
    if (!parsed.ok) return parsed.response;

    const kr = await prisma.oKRKeyResult.create({
      data: {
        objectiveId: params.id,
        title: parsed.data.title,
        targetValue: parsed.data.targetValue,
        currentValue: parsed.data.currentValue ?? 0,
        unit: parsed.data.unit ?? null,
      },
    });
    return NextResponse.json(kr, { status: 201 });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, keyResultPatchSchema);
    if (!parsed.ok) return parsed.response;

    const { krId, ...updateData } = parsed.data;

    const kr = await prisma.oKRKeyResult.findFirst({
      where: {
        id: krId,
        objectiveId: params.id,
        objective: { userId },
      },
      select: { id: true },
    });
    if (!kr)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const updated = await prisma.oKRKeyResult.update({
      where: { id: krId },
      data: updateData,
    });
    return NextResponse.json(updated);
  });
}
