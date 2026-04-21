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

    // Transaction: borrar sesión + rebajar currentPage del libro
    await prisma.$transaction([
      prisma.readingSession.delete({ where: { id } }),
      prisma.book.update({
        where: { id: session.bookId },
        data: { currentPage: { decrement: session.pagesRead } },
      }),
    ]);
    return new NextResponse(null, { status: 204 });
  });
}
