import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const review = await prisma.weeklyReview.findFirst({ where: { id, userId: session.user.id } });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(review);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.weeklyReview.updateMany({
    where: { id, userId: session.user.id },
    data: {
      ...(body.wins !== undefined && { wins: body.wins }),
      ...(body.challenges !== undefined && { challenges: body.challenges }),
      ...(body.learnings !== undefined && { learnings: body.learnings }),
      ...(body.nextWeekGoals !== undefined && { nextWeekGoals: body.nextWeekGoals }),
      ...(body.gratitude !== undefined && { gratitude: body.gratitude }),
      ...(body.overallRating !== undefined && { overallRating: body.overallRating }),
      ...(body.energyLevel !== undefined && { energyLevel: body.energyLevel }),
      ...(body.productivityScore !== undefined && { productivityScore: body.productivityScore }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const review = await prisma.weeklyReview.findUnique({ where: { id } });
  return NextResponse.json(review);
}
