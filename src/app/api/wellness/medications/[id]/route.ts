import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, brand, dosage, frequency, timeOfDay, isActive } = await req.json();
  const med = await prisma.medication.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(brand !== undefined && { brand: brand?.trim() ?? null }),
      ...(dosage !== undefined && { dosage: dosage?.trim() ?? null }),
      ...(frequency !== undefined && { frequency }),
      ...(timeOfDay !== undefined && { timeOfDay }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  if (med.count === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const updated = await prisma.medication.findUnique({ where: { id: params.id }, include: { supplementFacts: true } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.medication.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return new NextResponse(null, { status: 204 });
}
