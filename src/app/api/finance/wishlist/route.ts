import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, price, priority, savedAmount, link } = body;

  if (!name || price === undefined || !priority) {
    return NextResponse.json({ error: "name, price y priority son requeridos" }, { status: 400 });
  }

  const item = await prisma.wishlistItem.create({
    data: {
      userId: session.user.id,
      name,
      price: parseFloat(price),
      priority,
      savedAmount: savedAmount ? parseFloat(savedAmount) : 0,
      link: link ?? null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
