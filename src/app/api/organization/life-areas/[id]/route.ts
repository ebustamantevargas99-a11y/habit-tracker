import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.lifeArea.updateMany({
    where: { id, userId: session.user.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      ...(body.score !== undefined && { score: body.score }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.color !== undefined && { color: body.color }),
    },
  });

  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const area = await prisma.lifeArea.findUnique({ where: { id } });
  return NextResponse.json(area);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.lifeArea.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
