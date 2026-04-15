import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const notes = await prisma.note.findMany({
    where: {
      userId: session.user.id,
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
  });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const note = await prisma.note.create({
    data: {
      userId: session.user.id,
      title: body.title,
      content: body.content ?? "",
      category: body.category ?? "general",
      tags: body.tags ?? [],
      isPinned: body.isPinned ?? false,
      color: body.color ?? "#FEFCE8",
    },
  });
  return NextResponse.json(note, { status: 201 });
}
