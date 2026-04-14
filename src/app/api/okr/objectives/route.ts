import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const objectives = await prisma.oKRObjective.findMany({
    where: { userId: session.user.id },
    include: { keyResults: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(objectives);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { title, description, type, parentId, startDate, endDate, targetValue, unit, color, emoji } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "title es requerido" }, { status: 400 });

  const obj = await prisma.oKRObjective.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      description: description?.trim() ?? null,
      type: type ?? "monthly",
      parentId: parentId ?? null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      targetValue: targetValue ?? 100,
      unit: unit ?? "%",
      color: color ?? "#B8860B",
      emoji: emoji ?? "🎯",
      progress: 0,
    },
    include: { keyResults: true },
  });
  return NextResponse.json(obj, { status: 201 });
}
