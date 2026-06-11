import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, bookUpdateSchema } from "@/lib/validation";
import { checkBookwormBadge } from "@/lib/gamification-utils";
import { todayLocal } from "@/lib/date/local";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const book = await prisma.book.findFirst({
      where: { id, userId },
      include: {
        sessions: { orderBy: { date: "desc" } },
      },
    });
    if (!book) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(book);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;

    const existing = await prisma.book.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, bookUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;

    // Auto-stamp finishedAt en día civil del usuario (antes UTC → de noche
    // en Lima fechaba el libro como terminado mañana).
    let finishedAt = d.finishedAt;
    if (d.status === "finished" && d.finishedAt === undefined) {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { timezone: true },
      });
      finishedAt = todayLocal(profile?.timezone ?? null);
    }

    const updated = await prisma.book.update({
      where: { id },
      data: {
        ...("title" in d ? { title: d.title } : {}),
        ...("author" in d ? { author: d.author ?? null } : {}),
        ...("totalPages" in d ? { totalPages: d.totalPages ?? null } : {}),
        ...("currentPage" in d ? { currentPage: d.currentPage } : {}),
        ...("status" in d ? { status: d.status } : {}),
        ...("rating" in d ? { rating: d.rating ?? null } : {}),
        ...("coverUrl" in d ? { coverUrl: d.coverUrl ?? null } : {}),
        ...("genre" in d ? { genre: d.genre ?? null } : {}),
        ...("notes" in d ? { notes: d.notes ?? null } : {}),
        ...("startedAt" in d ? { startedAt: d.startedAt ?? null } : {}),
        ...(finishedAt !== undefined ? { finishedAt: finishedAt ?? null } : {}),
      },
    });

    // Badge "bookworm" al terminar un libro.
    if (d.status === "finished") {
      await checkBookwormBadge(prisma, userId);
    }

    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.book.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await prisma.book.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
