import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, trainingProgramCreateSchema } from "@/lib/validation";
import { getTemplateById } from "@/lib/fitness/program-templates";
import { z } from "zod";

/**
 * GET  /api/fitness/programs                 → lista programas del user
 * POST /api/fitness/programs                 → crea custom (con schedule)
 * POST /api/fitness/programs?fromTemplate=id → instancia desde template library
 */

export async function GET() {
  return withAuth(async (userId) => {
    const programs = await prisma.trainingProgram.findMany({
      where: { userId },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      include: { phases: { orderBy: { weekStart: "asc" } } },
    });
    return NextResponse.json(programs);
  });
}

// Schema extra para desactivar todos antes de activar uno (atomic)
const fromTemplateSchema = z.object({
  templateId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activateNow: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const url = req.nextUrl;
    const isFromTemplate = url.searchParams.get("fromTemplate") === "1";

    if (isFromTemplate) {
      const parsed = await parseJson(req, fromTemplateSchema);
      if (!parsed.ok) return parsed.response;
      const { templateId, startDate, activateNow } = parsed.data;

      const template = getTemplateById(templateId);
      if (!template) {
        return NextResponse.json({ error: "Template no encontrado" }, { status: 404 });
      }

      // Si activateNow, desactiva todos los programas activos primero
      if (activateNow) {
        await prisma.trainingProgram.updateMany({
          where: { userId, active: true },
          data: { active: false },
        });
      }

      // Calcular endDate
      const start = new Date(startDate + "T00:00:00Z");
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + template.durationWeeks * 7);
      const endDate = end.toISOString().split("T")[0];

      const created = await prisma.trainingProgram.create({
        data: {
          userId,
          name: template.name,
          description: template.description,
          type: template.type,
          goal: template.goal,
          durationWeeks: template.durationWeeks,
          daysPerWeek: template.daysPerWeek,
          startDate,
          endDate,
          active: activateNow ?? false,
          schedule: template.schedule as unknown as object[],
          phases: {
            create: template.phases.map((p) => ({
              name: p.name,
              weekStart: p.weekStart,
              weekEnd: p.weekEnd,
              targetRpeMin: p.targetRpeMin ?? null,
              targetRpeMax: p.targetRpeMax ?? null,
              targetSetsPerMuscle: p.targetSetsPerMuscle ?? null,
              notes: p.notes ?? null,
            })),
          },
        },
        include: { phases: true },
      });
      return NextResponse.json(created, { status: 201 });
    }

    // Crear custom
    const parsed = await parseJson(req, trainingProgramCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    if (d.active) {
      await prisma.trainingProgram.updateMany({
        where: { userId, active: true },
        data: { active: false },
      });
    }

    const created = await prisma.trainingProgram.create({
      data: {
        userId,
        name: d.name,
        description: d.description ?? null,
        type: d.type ?? "linear",
        goal: d.goal ?? null,
        durationWeeks: d.durationWeeks,
        daysPerWeek: d.daysPerWeek ?? 4,
        startDate: d.startDate,
        endDate: d.endDate ?? null,
        active: d.active ?? false,
        schedule: d.schedule ?? [],
      },
      include: { phases: true },
    });

    return NextResponse.json(created, { status: 201 });
  });
}
