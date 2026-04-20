import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, fastingUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.fastingLog.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, fastingUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const updated = await prisma.fastingLog.update({
      where: { id: params.id },
      data: {
        ...(d.endTime !== undefined && {
          endTime: d.endTime ? new Date(d.endTime) : null,
        }),
        ...(d.completed !== undefined && { completed: d.completed }),
        ...(d.notes !== undefined && { notes: d.notes }),
      },
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.fastingLog.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.fastingLog.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
