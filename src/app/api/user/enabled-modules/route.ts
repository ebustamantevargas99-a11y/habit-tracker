import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, enabledModulesUpdateSchema } from "@/lib/validation";
import { CORE_MODULES } from "@/lib/onboarding-constants";

export async function PUT(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, enabledModulesUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const merged = Array.from(
      new Set([...CORE_MODULES, ...parsed.data.enabledModules])
    );

    const profile = await prisma.userProfile.update({
      where: { userId },
      data: { enabledModules: merged },
      select: { enabledModules: true },
    });

    return NextResponse.json(profile);
  });
}
