import { randomBytes, createHash } from "crypto";
import { prisma } from "./prisma";

const TOKEN_BYTES = 32; // 256 bits de entropía
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export function generateToken(): { plain: string; hash: string } {
  const plain = randomBytes(TOKEN_BYTES).toString("base64url");
  const hash = hashToken(plain);
  return { plain, hash };
}

export function hashToken(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

export async function createPasswordResetToken(
  userId: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<string> {
  // Invalidar tokens activos previos (solo uno vivo por vez)
  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  const { plain, hash } = generateToken();
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      ipAddress,
      userAgent,
    },
  });
  return plain;
}

export async function consumePasswordResetToken(
  plainToken: string
): Promise<{ userId: string } | { error: "invalid" | "expired" | "used" }> {
  const hash = hashToken(plainToken);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hash },
  });

  if (!record) return { error: "invalid" };
  if (record.usedAt) return { error: "used" };
  if (record.expiresAt < new Date()) return { error: "expired" };

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { userId: record.userId };
}

export async function createEmailVerificationToken(
  userId: string
): Promise<string> {
  await prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  const { plain, hash } = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  });
  return plain;
}

export async function consumeEmailVerificationToken(
  plainToken: string
): Promise<{ userId: string } | { error: "invalid" | "expired" | "used" }> {
  const hash = hashToken(plainToken);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hash },
  });

  if (!record) return { error: "invalid" };
  if (record.usedAt) return { error: "used" };
  if (record.expiresAt < new Date()) return { error: "expired" };

  await prisma.emailVerificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { userId: record.userId };
}
