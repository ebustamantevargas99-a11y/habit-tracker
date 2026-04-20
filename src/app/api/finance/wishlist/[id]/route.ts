import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, wishlistUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const item = await prisma.wishlistItem.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!item)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, wishlistUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const updated = await prisma.wishlistItem.update({
      where: { id: params.id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.price !== undefined && { price: d.price }),
        ...(d.priority !== undefined && { priority: d.priority }),
        ...(d.url !== undefined && { link: d.url }),
        ...(d.isPurchased !== undefined && { isPurchased: d.isPurchased }),
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
    const item = await prisma.wishlistItem.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!item)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.wishlistItem.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
