import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export async function parseJson<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "JSON inválido" }, { status: 400 }),
    };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Datos inválidos",
          issues: result.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}

export * from "./schemas/auth";
export * from "./schemas/finance";
export * from "./schemas/common";
export * from "./schemas/fitness";
export * from "./schemas/wellness";
export * from "./schemas/productivity";
export * from "./schemas/okr";
export * from "./schemas/organization";
export * from "./schemas/nutrition";
export * from "./schemas/habits";
export * from "./schemas/user";
export * from "./schemas/reading";
export * from "./schemas/fasting";
export * from "./schemas/meditation";
export * from "./schemas/cycle";
export * from "./schemas/lifeos";
export * from "./schemas/nutrition-extras";
export * from "./schemas/fitness-extras";
export * from "./schemas/calendar";
