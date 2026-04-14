import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const challenges = await prisma.fitnessChallenge.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(challenges);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, description, startDate, endDate, targetValue, unit } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name es requerido" }, { status: 400 });

  const ch = await prisma.fitnessChallenge.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() ?? null,
      startDate: startDate ?? new Date().toISOString().split("T")[0],
      endDate: endDate ?? "",
      targetValue: targetValue ?? 30,
      unit: unit ?? "días",
    },
  });
  return NextResponse.json(ch, { status: 201 });
}
