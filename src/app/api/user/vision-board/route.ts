import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, visionBoardUpdateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { visionBoard: true },
    });
    return NextResponse.json(profile?.visionBoard ?? null);
  });
}

export async function PUT(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, visionBoardUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const visionBoard = parsed.data as Prisma.InputJsonValue;
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, visionBoard },
      update: { visionBoard },
    });
    return NextResponse.json(profile.visionBoard);
  });
}
