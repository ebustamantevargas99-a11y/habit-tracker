import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, transactionUpdateSchema } from "@/lib/validation";
import {
  sourceBalanceDelta,
  destinationBalanceDelta,
  type TxnType,
} from "@/lib/finance/balance";

type TxnShape = {
  accountId: string;
  type: string;
  amount: number;
  transferToAccountId: string | null;
};

/**
 * Aplica (o revierte, con sign=-1) el impacto de una transacción sobre el
 * balance de su(s) cuenta(s), dentro de una transacción Prisma. Carga el
 * tipo de cada cuenta para respetar la convención activo/pasivo.
 */
async function applyTxnToBalances(
  db: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  txn: TxnShape,
  sign: 1 | -1,
) {
  const src = await db.financialAccount.findUnique({
    where: { id: txn.accountId },
    select: { type: true },
  });
  await db.financialAccount.update({
    where: { id: txn.accountId },
    data: {
      balance: {
        increment:
          sign * sourceBalanceDelta(src?.type, txn.type as TxnType, txn.amount),
      },
    },
  });
  if (txn.type === "transfer" && txn.transferToAccountId) {
    const dest = await db.financialAccount.findUnique({
      where: { id: txn.transferToAccountId },
      select: { type: true },
    });
    await db.financialAccount.update({
      where: { id: txn.transferToAccountId },
      data: {
        balance: { increment: sign * destinationBalanceDelta(dest?.type, txn.amount) },
      },
    });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, transactionUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Valores resueltos de la transacción DESPUÉS del update (lo que el
    // usuario no edita conserva el valor anterior).
    const newAccountId = "accountId" in d && d.accountId ? d.accountId : existing.accountId;
    const newType = ("type" in d && d.type ? d.type : existing.type) as TxnType;
    const newAmount = "amount" in d && d.amount != null ? d.amount : existing.amount;
    const newTransferTo =
      "transferToAccountId" in d ? d.transferToAccountId ?? null : existing.transferToAccountId;

    // Si cambian las cuentas referidas, verificar ownership (evita IDOR y
    // que el saldo de una cuenta ajena se mueva).
    const accountIdsToCheck: string[] = [];
    if (newAccountId !== existing.accountId) accountIdsToCheck.push(newAccountId);
    if (
      newType === "transfer" &&
      newTransferTo &&
      newTransferTo !== existing.transferToAccountId &&
      !accountIdsToCheck.includes(newTransferTo)
    ) {
      accountIdsToCheck.push(newTransferTo);
    }
    if (accountIdsToCheck.length > 0) {
      const owned = await prisma.financialAccount.count({
        where: { id: { in: accountIdsToCheck }, userId },
      });
      if (owned !== accountIdsToCheck.length) {
        return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
      }
    }
    if (newType === "transfer" && (!newTransferTo || newTransferTo === newAccountId)) {
      return NextResponse.json(
        { error: "Transferencia requiere cuenta destino distinta" },
        { status: 400 }
      );
    }

    // Reconciliación atómica: revertir el efecto del registro ANTERIOR y
    // aplicar el del NUEVO. Sin esto, editar monto/tipo/cuenta dejaba el
    // saldo descuadrado (era el bug crítico de integridad de dinero).
    const updated = await prisma.$transaction(async (db) => {
      await applyTxnToBalances(
        db,
        {
          accountId: existing.accountId,
          type: existing.type,
          amount: existing.amount,
          transferToAccountId: existing.transferToAccountId,
        },
        -1,
      );
      await applyTxnToBalances(
        db,
        {
          accountId: newAccountId,
          type: newType,
          amount: newAmount,
          transferToAccountId: newType === "transfer" ? newTransferTo : null,
        },
        1,
      );
      return db.transaction.update({
        where: { id: params.id },
        data: {
          ...("accountId" in d ? { accountId: d.accountId } : {}),
          ...("date" in d ? { date: d.date } : {}),
          ...("amount" in d ? { amount: d.amount } : {}),
          ...("type" in d ? { type: d.type } : {}),
          ...("category" in d ? { category: d.category } : {}),
          ...("subcategory" in d ? { subcategory: d.subcategory ?? null } : {}),
          ...("merchant" in d ? { merchant: d.merchant ?? null } : {}),
          ...("description" in d ? { description: d.description ?? null } : {}),
          ...("notes" in d ? { notes: d.notes ?? null } : {}),
          ...("tags" in d ? { tags: d.tags ?? [] } : {}),
          ...("photoData" in d ? { photoData: d.photoData ?? null } : {}),
          // Mantener transferToAccountId coherente con el tipo resultante.
          transferToAccountId: newType === "transfer" ? newTransferTo : null,
        },
      });
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const tx = await prisma.transaction.findFirst({
      where: { id: params.id, userId },
    });
    if (!tx)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Revertir el impacto en balance al borrar (mismo helper que create:
    // respeta activo/pasivo en origen Y destino, incl. pagos de tarjeta).
    await prisma.$transaction(async (db) => {
      await applyTxnToBalances(
        db,
        {
          accountId: tx.accountId,
          type: tx.type,
          amount: tx.amount,
          transferToAccountId: tx.transferToAccountId,
        },
        -1,
      );
      await db.transaction.delete({ where: { id: params.id } });
    });
    return new NextResponse(null, { status: 204 });
  });
}
