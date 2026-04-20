import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, wishlistCreateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, wishlistCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const item = await prisma.wishlistItem.create({
      data: {
        userId,
        name: d.name,
        price: d.price,
        priority: d.priority ?? "medium",
        link: d.url ?? null,
        isPurchased: d.isPurchased ?? false,
      },
    });
    return NextResponse.json(item, { status: 201 });
  });
}
