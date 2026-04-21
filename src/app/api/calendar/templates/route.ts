import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, dayTemplateCreateSchema } from "@/lib/validation";

export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const templates = await prisma.dayTemplate.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(templates);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, dayTemplateCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const template = await prisma.dayTemplate.create({
      data: {
        userId,
        name: d.name,
        blocks: d.blocks as unknown as object,
      },
    });
    return NextResponse.json(template, { status: 201 });
  });
}
