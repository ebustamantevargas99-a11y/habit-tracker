import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, readingSessionCreateSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id: bookId } = await params;

    const book = await prisma.book.findFirst({
      where: { id: bookId, userId },
    });
    if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 });

    const parsed = await parseJson(req, readingSessionCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const today = new Date().toISOString().split("T")[0];
    const date = d.date ?? today;
    const pagesRead = d.pagesRead ?? 0;

    // Transaction: crear sesión + actualizar currentPage del libro
    const [session] = await prisma.$transaction([
      prisma.readingSession.create({
        data: {
          userId,
          bookId,
          date,
          pagesRead,
          minutes: d.minutes ?? null,
          notes: d.notes ?? null,
        },
      }),
      prisma.book.update({
        where: { id: bookId },
        data: {
          currentPage: Math.min(
            book.totalPages ?? Number.MAX_SAFE_INTEGER,
            book.currentPage + pagesRead
          ),
          startedAt: book.startedAt ?? date,
          // Si llegó al total, marcar como finished
          ...(book.totalPages &&
          book.currentPage + pagesRead >= book.totalPages &&
          book.status !== "finished"
            ? { status: "finished", finishedAt: date }
            : {}),
        },
      }),
    ]);
    return NextResponse.json(session, { status: 201 });
  });
}
