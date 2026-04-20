import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { logger } from "./logger";

export type SecurityEventType =
  | "login_success"
  | "login_failed"
  | "register"
  | "logout"
  | "password_reset_requested"
  | "password_reset_completed"
  | "password_changed"
  | "email_verified"
  | "email_verification_sent"
  | "account_deleted"
  | "data_exported"
  | "2fa_enabled"
  | "2fa_disabled"
  | "rate_limited"
  | "suspicious_activity";

export function getClientIp(req: NextRequest | Request): string | null {
  const headers = "headers" in req ? req.headers : null;
  if (!headers) return null;
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return null;
}

export function getUserAgent(req: NextRequest | Request): string | null {
  const headers = "headers" in req ? req.headers : null;
  return headers?.get("user-agent") ?? null;
}

export type LogEventParams = {
  eventType: SecurityEventType;
  userId?: string | null;
  email?: string | null;
  request?: NextRequest | Request;
  metadata?: Record<string, unknown>;
};

export async function logSecurityEvent(params: LogEventParams): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: params.eventType,
        userId: params.userId ?? null,
        email: params.email ?? null,
        ipAddress: params.request ? getClientIp(params.request) : null,
        userAgent: params.request ? getUserAgent(params.request) : null,
        metadata: (params.metadata ?? {}) as object,
      },
    });
  } catch (e) {
    logger.error("security-log:failed", {
      eventType: params.eventType,
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}

export async function getRecentEvents(userId: string, limit = 50) {
  return prisma.securityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200),
    select: {
      id: true,
      eventType: true,
      ipAddress: true,
      userAgent: true,
      metadata: true,
      createdAt: true,
    },
  });
}
