import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const appts = await prisma.medicalAppointment.findMany({
    where: { userId: session.user.id },
    orderBy: { dateTime: "asc" },
  });
  return NextResponse.json(appts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { doctorName, specialty, location, dateTime, reason, notes } = await req.json();
  if (!doctorName?.trim()) return NextResponse.json({ error: "doctorName es requerido" }, { status: 400 });

  const appt = await prisma.medicalAppointment.create({
    data: {
      userId: session.user.id,
      doctorName: doctorName.trim(),
      specialty: specialty?.trim() ?? "",
      location: location?.trim() ?? null,
      dateTime: dateTime ?? new Date().toISOString(),
      reason: reason?.trim() ?? null,
      notes: notes?.trim() ?? null,
    },
  });
  return NextResponse.json(appt, { status: 201 });
}
