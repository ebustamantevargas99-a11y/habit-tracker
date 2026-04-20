import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, projectCreateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const projects = await prisma.project.findMany({
      where: { userId, status: { not: "deleted" } },
      include: { tasks: { orderBy: { orderIndex: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(projects);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, projectCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const project = await prisma.project.create({
      data: {
        userId,
        name: d.name,
        description: d.description ?? null,
        color: d.color ?? "#B8860B",
        emoji: d.emoji ?? "🚀",
      },
      include: { tasks: true },
    });
    return NextResponse.json(project, { status: 201 });
  });
}
