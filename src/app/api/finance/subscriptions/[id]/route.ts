import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, subscriptionUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const sub = await prisma.subscription.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!sub)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, subscriptionUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const updated = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.amount !== undefined && { amount: d.amount }),
        ...(d.billingCycle !== undefined && { billingCycle: d.billingCycle }),
        ...(d.nextBilling !== undefined && { renewalDate: d.nextBilling }),
        ...(d.category !== undefined && d.category !== null && { category: d.category }),
        ...(d.isActive !== undefined && { isActive: d.isActive }),
      },
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const sub = await prisma.subscription.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!sub)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.subscription.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
