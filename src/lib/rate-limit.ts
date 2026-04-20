import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const memBuckets = new Map<string, Bucket>();

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_UPSTASH = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function gc(now: number) {
  if (memBuckets.size < 1000) return;
  memBuckets.forEach((v, k) => {
    if (v.resetAt < now) memBuckets.delete(k);
  });
}

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  key: string;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

async function checkMemory(
  id: string,
  opts: RateLimitOptions,
  now: number
): Promise<RateLimitResult> {
  gc(now);
  const bucket = memBuckets.get(id);

  if (!bucket || bucket.resetAt < now) {
    memBuckets.set(id, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.limit - 1, resetAt: now + opts.windowMs };
  }

  if (bucket.count >= opts.limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: opts.limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

async function checkUpstash(
  id: string,
  opts: RateLimitOptions,
  now: number
): Promise<RateLimitResult> {
  const ttlSeconds = Math.ceil(opts.windowMs / 1000);
  const pipeline = [
    ["INCR", id],
    ["EXPIRE", id, String(ttlSeconds), "NX"],
    ["PTTL", id],
  ];

  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
      cache: "no-store",
    });

    if (!res.ok) return checkMemory(id, opts, now);

    const data = (await res.json()) as Array<{ result: number }>;
    const count = Number(data[0]?.result ?? 0);
    const pttl = Number(data[2]?.result ?? opts.windowMs);
    const resetAt = now + (pttl > 0 ? pttl : opts.windowMs);

    if (count > opts.limit) {
      return { allowed: false, remaining: 0, resetAt };
    }
    return {
      allowed: true,
      remaining: Math.max(0, opts.limit - count),
      resetAt,
    };
  } catch {
    return checkMemory(id, opts, now);
  }
}

export async function checkRateLimit(
  req: NextRequest,
  opts: RateLimitOptions
): Promise<NextResponse | null> {
  const now = Date.now();
  const id = `ratelimit:${opts.key}:${getClientIp(req)}`;

  const result = USE_UPSTASH
    ? await checkUpstash(id, opts, now)
    : await checkMemory(id, opts, now);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(opts.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
      {
        status: 429,
        headers: { ...headers, "Retry-After": String(Math.max(retryAfter, 1)) },
      }
    );
  }

  return null;
}

export const rateLimits = {
  register: { limit: 5, windowMs: 60 * 60 * 1000, key: "register" },
  login: { limit: 10, windowMs: 5 * 60 * 1000, key: "login" },
  apiMutation: { limit: 120, windowMs: 60 * 1000, key: "api-mutation" },
  passwordReset: { limit: 3, windowMs: 60 * 60 * 1000, key: "password-reset" },
  accountDelete: { limit: 3, windowMs: 60 * 60 * 1000, key: "account-delete" },
} as const;
