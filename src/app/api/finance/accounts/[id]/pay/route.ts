import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, accountPaySchema } from "@/lib/validation";

/**
 * POST /api/finance/accounts/[id]/pay
 *
 * Pagar una tarjeta de crédito (o préstamo) desde otra cuenta. Crea
 * una transferencia atómica:
 *   1. Verifica ownership de ambas cuentas (target + fromAccount).
 *   2. Verifica que el target sea credit/loan y que fromAccount NO lo sea.
 *   3. Crea una Transaction tipo "transfer" que liga ambas cuentas.
 *   4. Reduce balance del fromAccount en `amount`.
 *   5. Reduce balance del target (crédito) en `amount` — el balance
 *      positivo en cuentas credit representa la deuda actual.
 *
 * Todo dentro de un `prisma.$transaction` para que sea atómico — si
 * alguna parte falla, ningún balance cambia.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async (userId) => {
    const { id: targetId } = await params;

    const parsed = await parseJson(req, accountPaySchema);
    if (!parsed.ok) return parsed.response;
    const { fromAccountId, amount, date, notes } = parsed.data;

    if (fromAccountId === targetId) {
      return NextResponse.json(
        { error: "La cuenta origen y destino no pueden ser la misma" },
        { status: 400 },
      );
    }

    // Cargar ambas cuentas con ownership check.
    const [target, source] = await Promise.all([
      prisma.financialAccount.findFirst({
        where: { id: targetId, userId },
        select: { id: true, name: true, type: true, currency: true, balance: true },
      }),
      prisma.financialAccount.findFirst({
        where: { id: fromAccountId, userId },
        select: { id: true, name: true, type: true, currency: true, balance: true },
      }),
    ]);

    if (!target) {
      return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }
    if (!source) {
      return NextResponse.json({ error: "Cuenta origen no encontrada" }, { status: 404 });
    }

    if (target.type !== "credit" && target.type !== "loan") {
      return NextResponse.json(
        { error: "Solo se pueden pagar cuentas de tipo credit o loan" },
        { status: 400 },
      );
    }
    if (source.type === "credit" || source.type === "loan") {
      return NextResponse.json(
        { error: "No se puede pagar una tarjeta desde otra tarjeta o préstamo" },
        { status: 400 },
      );
    }

    // Permitimos overpay (saldo del crédito quedaría negativo = saldo a favor)
    // y warning si la fuente queda en negativo, pero NO bloqueamos: la app
    // refleja la realidad del banco, no impone límites artificiales.

    const txnDate = date ?? new Date().toISOString().split("T")[0];
    const description = `Pago a ${target.name}`;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const txn = await tx.transaction.create({
          data: {
            userId,
            accountId: source.id,
            transferToAccountId: target.id,
            amount,
            type: "transfer",
            category: "Pago de tarjeta",
            subcategory: target.name,
            description,
            notes: notes ?? null,
            date: txnDate,
          },
        });

        await tx.financialAccount.update({
          where: { id: source.id },
          data: { balance: { decrement: amount } },
        });

        await tx.financialAccount.update({
          where: { id: target.id },
          data: { balance: { decrement: amount } },
        });

        return txn;
      });

      return NextResponse.json(
        {
          ok: true,
          transactionId: result.id,
          paidAmount: amount,
          targetNewBalance: +(target.balance - amount).toFixed(2),
          sourceNewBalance: +(source.balance - amount).toFixed(2),
        },
        { status: 201 },
      );
    } catch (e) {
      console.error("[finance/accounts/pay] failed:", e);
      return NextResponse.json(
        { error: "Error procesando el pago" },
        { status: 500 },
      );
    }
  });
}
