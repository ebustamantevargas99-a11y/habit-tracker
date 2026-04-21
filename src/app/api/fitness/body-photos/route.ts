import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, bodyPhotoCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "60", 10)));
    const photos = await prisma.bodyPhoto.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: limit,
    });
    return NextResponse.json(photos);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, bodyPhotoCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const photo = await prisma.bodyPhoto.create({
      data: {
        userId,
        date: d.date ?? new Date().toISOString().split("T")[0],
        category: d.category ?? "front",
        photoData: d.photoData,
        weight: d.weight ?? null,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(photo, { status: 201 });
  });
}
