import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, billCreateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const bills = await prisma.bill.findMany({
      where: { userId },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json(bills);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, billCreateSchema);
    if (!parsed.ok) return parsed.response;

    const bill = await prisma.bill.create({
      data: { userId, ...parsed.data, isPaid: parsed.data.isPaid ?? false },
    });
    return NextResponse.json(bill, { status: 201 });
  });
}
