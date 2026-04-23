import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, profileUpdateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        profile: true,
      },
    });
    return NextResponse.json(user);
  });
}

export async function PATCH(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, profileUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;

    if (d.name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: d.name },
      });
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: d.bio ?? null,
        timezone: d.timezone ?? "America/Mexico_City",
        units: d.units ?? "metric",
        language: d.language ?? "es",
        theme: d.theme ?? "pergamino",
        weekStartsOn: d.weekStartsOn ?? 1,
        stepsGoal: d.stepsGoal ?? 10000,
        waterGoal: d.waterGoal ?? 2.0,
        sleepGoal: d.sleepGoal ?? 8.0,
      },
      update: {
        ...(d.bio !== undefined && { bio: d.bio }),
        ...(d.timezone !== undefined && { timezone: d.timezone }),
        ...(d.units !== undefined && { units: d.units }),
        ...(d.language !== undefined && { language: d.language }),
        ...(d.theme !== undefined && { theme: d.theme }),
        ...(d.weekStartsOn !== undefined && { weekStartsOn: d.weekStartsOn }),
        ...(d.stepsGoal !== undefined && { stepsGoal: d.stepsGoal }),
        ...(d.waterGoal !== undefined && { waterGoal: d.waterGoal }),
        ...(d.sleepGoal !== undefined && { sleepGoal: d.sleepGoal }),
      },
    });

    return NextResponse.json(profile);
  });
}
