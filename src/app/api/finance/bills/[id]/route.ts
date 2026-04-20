import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, billUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const bill = await prisma.bill.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!bill)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, billUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.bill.update({
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
    const bill = await prisma.bill.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!bill)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.bill.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
