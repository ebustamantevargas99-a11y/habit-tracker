import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const session = await prisma.readingSession.findFirst({
      where: { id, userId },
    });
    if (!session) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.$transaction(async (db) => {
      await db.readingSession.delete({ where: { id } });
      const book = await db.book.findUnique({
        where: { id: session.bookId },
        select: { currentPage: true, totalPages: true, status: true },
      });
      if (!book) return;
      // Clamp a 0 (antes podía quedar negativo) y, si el libro estaba
      // "terminado" pero ya no llega al total, revertir a "leyendo".
      const newPage = Math.max(0, book.currentPage - session.pagesRead);
      const unfinish =
        book.status === "finished" &&
        book.totalPages != null &&
        newPage < book.totalPages;
      await db.book.update({
        where: { id: session.bookId },
        data: {
          currentPage: newPage,
          ...(unfinish ? { status: "reading", finishedAt: null } : {}),
        },
      });
    });
    return new NextResponse(null, { status: 204 });
  });
}
