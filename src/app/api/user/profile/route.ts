import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, bio, timezone, units, language, theme, weekStartsOn, stepsGoal, waterGoal, sleepGoal } = body;

  // Update user name if provided
  if (name !== undefined) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });
  }

  // Upsert profile
  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      bio: bio ?? null,
      timezone: timezone ?? "America/Mexico_City",
      units: units ?? "metric",
      language: language ?? "es",
      theme: theme ?? "warm",
      weekStartsOn: weekStartsOn ?? 1,
      stepsGoal: stepsGoal ?? 10000,
      waterGoal: waterGoal ?? 2.0,
      sleepGoal: sleepGoal ?? 8.0,
    },
    update: {
      ...(bio !== undefined && { bio }),
      ...(timezone !== undefined && { timezone }),
      ...(units !== undefined && { units }),
      ...(language !== undefined && { language }),
      ...(theme !== undefined && { theme }),
      ...(weekStartsOn !== undefined && { weekStartsOn }),
      ...(stepsGoal !== undefined && { stepsGoal }),
      ...(waterGoal !== undefined && { waterGoal }),
      ...(sleepGoal !== undefined && { sleepGoal }),
    },
  });

  return NextResponse.json(profile);
}
