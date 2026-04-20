import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, subscriptionCreateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { renewalDate: "asc" },
    });
    return NextResponse.json(subscriptions);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, subscriptionCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        name: d.name,
        amount: d.amount,
        billingCycle: d.billingCycle,
        renewalDate: d.nextBilling,
        category: d.category ?? "other",
        isActive: d.isActive ?? true,
      },
    });
    return NextResponse.json(subscription, { status: 201 });
  });
}
