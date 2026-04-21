import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";

const applySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type TemplateBlock = {
  startHour: number;
  durHours: number;
  title: string;
  type?: string;
  icon?: string;
  color?: string;
};

// POST = aplica el template a una fecha (crea eventos calendario)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const template = await prisma.dayTemplate.findFirst({ where: { id, userId } });
    if (!template) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    const parsed = await parseJson(req, applySchema);
    if (!parsed.ok) return parsed.response;
    const { date } = parsed.data;

    const blocks = template.blocks as unknown as TemplateBlock[];
    if (!Array.isArray(blocks) || blocks.length === 0) {
      return NextResponse.json({ error: "Template vacía" }, { status: 400 });
    }

    const baseDate = new Date(`${date}T00:00:00`);
    const created = await prisma.$transaction(
      blocks.map((b) => {
        const startAt = new Date(baseDate);
        startAt.setHours(Math.floor(b.startHour), Math.round((b.startHour - Math.floor(b.startHour)) * 60));
        const endAt = new Date(startAt.getTime() + b.durHours * 3600000);
        return prisma.calendarEvent.create({
          data: {
            userId,
            title: b.title,
            startAt,
            endAt,
            type: (b.type as string) ?? "custom",
            icon: b.icon ?? null,
            color: b.color ?? null,
          },
        });
      })
    );
    return NextResponse.json({ events: created }, { status: 201 });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.dayTemplate.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    await prisma.dayTemplate.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
