import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, budgetUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const budget = await prisma.budget.findFirst({
      where: { id: params.id, userId },
    });
    if (!budget)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, budgetUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.budget.update({
      where: { id: params.id },
      data: { limit: parsed.data.limit },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const budget = await prisma.budget.findFirst({
      where: { id: params.id, userId },
    });
    if (!budget)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.budget.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
