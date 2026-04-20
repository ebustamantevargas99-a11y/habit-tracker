import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, challengeUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.fitnessChallenge.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, challengeUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.fitnessChallenge.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.fitnessChallenge.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.fitnessChallenge.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
