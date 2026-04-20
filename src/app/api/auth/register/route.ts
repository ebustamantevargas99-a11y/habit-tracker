import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseJson, registerSchema } from "@/lib/validation";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const BCRYPT_ROUNDS = 13;

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, rateLimits.register);
  if (limited) return limited;

  try {
    const parsed = await parseJson(req, registerSchema);
    if (!parsed.ok) return parsed.response;

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: name ?? null,
        email,
        passwordHash,
        profile: { create: {} },
        gamification: { create: {} },
      },
      select: { id: true, email: true, name: true },
    });

    logger.info("register:success", { userId: user.id });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    logger.error("register:failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
