import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseJson, noteUpdateSchema } from "@/lib/validation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(note);
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;

    const existing = await prisma.note.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req as import("next/server").NextRequest, noteUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.note.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;

    const existing = await prisma.note.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.note.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
