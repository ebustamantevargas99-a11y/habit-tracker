import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, challengeCreateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const challenges = await prisma.fitnessChallenge.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(challenges);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, challengeCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const ch = await prisma.fitnessChallenge.create({
      data: {
        userId,
        name: d.name,
        description: d.description ?? null,
        startDate: d.startDate ?? new Date().toISOString().split("T")[0],
        endDate: d.endDate ?? "",
        targetValue: d.targetValue ?? 30,
        unit: d.unit ?? "días",
      },
    });
    return NextResponse.json(ch, { status: 201 });
  });
}
