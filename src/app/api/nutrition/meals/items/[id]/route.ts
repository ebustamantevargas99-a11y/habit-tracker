import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify item belongs to user via mealLog
  const item = await prisma.mealItem.findFirst({
    where: { id },
    include: { mealLog: true },
  });
  if (!item || item.mealLog.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.mealItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
