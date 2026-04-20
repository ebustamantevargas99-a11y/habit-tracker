import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { parseJson } from "@/lib/validation";
import { buildPrompt, gatherPromptContext } from "@/lib/ai-export";
import { logger } from "@/lib/logger";
import { z } from "zod";

const exportRequestSchema = z.object({
  scope: z.enum([
    "daily",
    "weekly",
    "monthly",
    "fitness",
    "finance",
    "wellness",
    "nutrition",
    "habits",
    "holistic",
  ]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  style: z.enum(["coach", "analyst", "retrospective", "projection"]).default("coach"),
  customQuestion: z.string().max(1000).optional(),
});

function scopeRange(scope: string, fromArg?: string, toArg?: string): { from: Date; to: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (fromArg && toArg) {
    return { from: new Date(fromArg), to: new Date(toArg) };
  }
  const from = new Date(today);
  switch (scope) {
    case "daily":
      return { from: today, to: today };
    case "weekly":
      from.setDate(today.getDate() - 6);
      return { from, to: today };
    case "monthly":
      from.setDate(today.getDate() - 29);
      return { from, to: today };
    case "fitness":
    case "finance":
    case "wellness":
    case "nutrition":
    case "habits":
      from.setDate(today.getDate() - 13);
      return { from, to: today };
    case "holistic":
      from.setDate(today.getDate() - 29);
      return { from, to: today };
    default:
      return { from: today, to: today };
  }
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, exportRequestSchema);
    if (!parsed.ok) return parsed.response;

    const { scope, style, customQuestion, from: fromArg, to: toArg } = parsed.data;
    const range = scopeRange(scope, fromArg, toArg);

    const ctx = await gatherPromptContext({
      userId,
      scope,
      from: range.from,
      to: range.to,
      style,
      customQuestion,
    });

    const prompt = buildPrompt(ctx);

    logger.info("ai-export:generated", {
      userId,
      scope,
      promptLength: prompt.length,
    });

    return NextResponse.json({
      prompt,
      scope,
      generatedAt: new Date().toISOString(),
      range: {
        from: range.from.toISOString().slice(0, 10),
        to: range.to.toISOString().slice(0, 10),
      },
    });
  });
}
