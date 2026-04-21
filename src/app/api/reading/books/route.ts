import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, bookCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const where: { userId: string; status?: string } = { userId };
    if (status) where.status = status;

    const books = await prisma.book.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        sessions: {
          select: { id: true, date: true, pagesRead: true, minutes: true },
          orderBy: { date: "desc" },
          take: 20,
        },
      },
    });
    return NextResponse.json(books);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, bookCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const book = await prisma.book.create({
      data: {
        userId,
        title: d.title,
        author: d.author ?? null,
        totalPages: d.totalPages ?? null,
        currentPage: d.currentPage ?? 0,
        status: d.status ?? "reading",
        rating: d.rating ?? null,
        coverUrl: d.coverUrl ?? null,
        genre: d.genre ?? null,
        notes: d.notes ?? null,
        startedAt: d.startedAt ?? null,
        finishedAt: d.finishedAt ?? null,
      },
    });
    return NextResponse.json(book, { status: 201 });
  });
}
