import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const krs = await prisma.oKRKeyResult.findMany({
    where: { objectiveId: params.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(krs);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Verify objective belongs to user
  const obj = await prisma.oKRObjective.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!obj) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { title, targetValue, currentValue, unit } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "title es requerido" }, { status: 400 });

  const kr = await prisma.oKRKeyResult.create({
    data: { objectiveId: params.id, title: title.trim(), targetValue: targetValue ?? 100, currentValue: currentValue ?? 0, unit: unit ?? null },
  });
  return NextResponse.json(kr, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { krId, currentValue, title, targetValue } = await req.json();
  if (!krId) return NextResponse.json({ error: "krId requerido" }, { status: 400 });

  const kr = await prisma.oKRKeyResult.update({
    where: { id: krId },
    data: {
      ...(currentValue !== undefined && { currentValue }),
      ...(title !== undefined && { title: title.trim() }),
      ...(targetValue !== undefined && { targetValue }),
    },
  });
  return NextResponse.json(kr);
}
