import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseJson, weeklyReviewUpdateSchema } from "@/lib/validation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const review = await prisma.weeklyReview.findFirst({
      where: { id, userId },
    });
    if (!review)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(review);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;

    const existing = await prisma.weeklyReview.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, weeklyReviewUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.weeklyReview.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  });
}
