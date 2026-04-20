import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, appointmentCreateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const appts = await prisma.medicalAppointment.findMany({
      where: { userId },
      orderBy: { dateTime: "asc" },
    });
    return NextResponse.json(appts);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, appointmentCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const appt = await prisma.medicalAppointment.create({
      data: {
        userId,
        doctorName: d.doctorName,
        specialty: d.specialty ?? "",
        location: d.location ?? null,
        dateTime: d.dateTime ?? new Date().toISOString(),
        reason: d.reason ?? null,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(appt, { status: 201 });
  });
}
