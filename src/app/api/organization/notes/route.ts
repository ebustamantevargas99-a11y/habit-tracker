import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseJson, noteCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const notes = await prisma.note.findMany({
      where: {
        userId,
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      take: 500,
    });
    return NextResponse.json(notes);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, noteCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const note = await prisma.note.create({
      data: {
        userId,
        title: d.title,
        content: d.content ?? "",
        category: d.category ?? "general",
        tags: d.tags ?? [],
        isPinned: d.isPinned ?? false,
        color: d.color ?? "#FEFCE8",
      },
    });
    return NextResponse.json(note, { status: 201 });
  });
}
