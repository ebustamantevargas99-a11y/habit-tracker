import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, mealPhotoSchema } from "@/lib/validation";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.mealLog.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, mealPhotoSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.mealLog.update({
      where: { id },
      data: { photoData: parsed.data.photoData },
      select: { id: true, photoData: true },
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.mealLog.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await prisma.mealLog.update({ where: { id }, data: { photoData: null } });
    return new NextResponse(null, { status: 204 });
  });
}
