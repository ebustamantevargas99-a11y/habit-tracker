import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, shoeCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const url = req.nextUrl;
    const includeRetired = url.searchParams.get("includeRetired") === "true";

    const shoes = await prisma.shoe.findMany({
      where: { userId, ...(includeRetired ? {} : { retired: false }) },
      orderBy: [{ retired: "asc" }, { currentKm: "desc" }],
    });

    return NextResponse.json(shoes);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, shoeCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const created = await prisma.shoe.create({
      data: {
        userId,
        name: d.name,
        brand: d.brand ?? null,
        model: d.model ?? null,
        purchaseDate: d.purchaseDate ?? null,
        currentKm: d.currentKm ?? 0,
        maxKm: d.maxKm ?? 800,
        retired: d.retired ?? false,
        retiredAt: d.retired ? new Date() : null,
        notes: d.notes ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  });
}
