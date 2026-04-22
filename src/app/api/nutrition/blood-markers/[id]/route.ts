import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, bloodMarkerUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.bloodMarker.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, bloodMarkerUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const data: Record<string, unknown> = {};
    const passthrough: (keyof typeof d)[] = [
      "context", "glucoseMgDl", "a1cPercent", "ketonesMmolL", "insulinMuIml",
      "systolic", "diastolic", "heartRate", "totalCholesterol", "hdl", "ldl",
      "triglycerides", "source", "notes",
    ];
    for (const k of passthrough) {
      if (d[k] !== undefined) data[k] = d[k];
    }
    if (d.measuredAt !== undefined) {
      data.measuredAt = d.measuredAt ? new Date(d.measuredAt) : null;
    }

    const updated = await prisma.bloodMarker.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.bloodMarker.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await prisma.bloodMarker.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
