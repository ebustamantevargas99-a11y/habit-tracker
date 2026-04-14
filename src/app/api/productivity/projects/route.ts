import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id, status: { not: "deleted" } },
    include: { tasks: { orderBy: { orderIndex: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, description, color, emoji } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name es requerido" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() ?? null,
      color: color ?? "#B8860B",
      emoji: emoji ?? "🚀",
    },
    include: { tasks: true },
  });
  return NextResponse.json(project, { status: 201 });
}
