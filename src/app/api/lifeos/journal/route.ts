import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, journalEntryCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "30", 10)));
    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: limit,
    });
    return NextResponse.json(entries);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, journalEntryCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        date: d.date ?? new Date().toISOString().split("T")[0],
        prompt: d.prompt ?? null,
        content: d.content,
        mood: d.mood ?? null,
        tags: d.tags ?? [],
      },
    });
    return NextResponse.json(entry, { status: 201 });
  });
}
