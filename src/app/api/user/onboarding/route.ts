import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, onboardingSchema } from "@/lib/validation";
import { deriveEnabledModules, type InterestKey, type BiologicalSex } from "@/lib/onboarding-constants";
import { logger } from "@/lib/logger";

export async function GET() {
  return withAuth(async (userId) => {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        onboardingCompleted: true,
        birthDate: true,
        biologicalSex: true,
        gender: true,
        pronouns: true,
        heightCm: true,
        weightKg: true,
        activityLevel: true,
        fitnessLevel: true,
        units: true,
        language: true,
        timezone: true,
        darkMode: true,
        interests: true,
        enabledModules: true,
        primaryGoals: true,
        conditions: true,
      },
    });
    return NextResponse.json(profile ?? { onboardingCompleted: false });
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, onboardingSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const enabledModules = deriveEnabledModules({
      interests: d.interests as InterestKey[],
      biologicalSex: d.biologicalSex as BiologicalSex,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { name: d.name },
    });

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        birthDate: new Date(d.birthDate),
        biologicalSex: d.biologicalSex,
        gender: d.gender ?? null,
        pronouns: d.pronouns ?? null,
        heightCm: d.heightCm ?? null,
        weightKg: d.weightKg ?? null,
        activityLevel: d.activityLevel ?? null,
        fitnessLevel: d.fitnessLevel ?? null,
        units: d.units,
        language: d.language,
        timezone: d.timezone,
        darkMode: d.darkMode,
        interests: d.interests,
        primaryGoals: d.primaryGoals,
        conditions: d.conditions,
        enabledModules,
        onboardingCompleted: true,
      },
      update: {
        birthDate: new Date(d.birthDate),
        biologicalSex: d.biologicalSex,
        gender: d.gender ?? null,
        pronouns: d.pronouns ?? null,
        heightCm: d.heightCm ?? null,
        weightKg: d.weightKg ?? null,
        activityLevel: d.activityLevel ?? null,
        fitnessLevel: d.fitnessLevel ?? null,
        units: d.units,
        language: d.language,
        timezone: d.timezone,
        darkMode: d.darkMode,
        interests: d.interests,
        primaryGoals: d.primaryGoals,
        conditions: d.conditions,
        enabledModules,
        onboardingCompleted: true,
      },
    });

    logger.info("onboarding:completed", {
      userId,
      interests: d.interests.length,
      enabledModules: enabledModules.length,
    });

    return NextResponse.json(profile, { status: 201 });
  });
}
