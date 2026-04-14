import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const result = await prisma.medicalAppointment.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: {
      ...(body.doctorName !== undefined && { doctorName: body.doctorName.trim() }),
      ...(body.specialty !== undefined && { specialty: body.specialty.trim() }),
      ...(body.location !== undefined && { location: body.location?.trim() ?? null }),
      ...(body.dateTime !== undefined && { dateTime: body.dateTime }),
      ...(body.reason !== undefined && { reason: body.reason?.trim() ?? null }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.result !== undefined && { result: body.result?.trim() ?? null }),
      ...(body.notes !== undefined && { notes: body.notes?.trim() ?? null }),
    },
  });
  if (result.count === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const updated = await prisma.medicalAppointment.findUnique({ where: { id: params.id } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.medicalAppointment.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return new NextResponse(null, { status: 204 });
}
