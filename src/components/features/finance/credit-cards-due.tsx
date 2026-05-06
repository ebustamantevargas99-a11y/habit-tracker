"use client";

import { useMemo, useState } from "react";
import { CreditCard, AlertTriangle, Calendar } from "lucide-react";
import { useFinanceStore, type FinancialAccount } from "@/stores/finance-store";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/components/ui";
import PayCardModal from "./pay-card-modal";

/**
 * Calcula días restantes hasta el próximo día N del mes.
 * Si hoy ya pasó el día N (de este mes), avanza al próximo mes.
 *
 *   daysUntilDayOfMonth(15) llamado un día 5  → 10
 *   daysUntilDayOfMonth(15) llamado un día 15 → 0  (es hoy)
 *   daysUntilDayOfMonth(15) llamado un día 20 → ~26 (próximo mes 15)
 */
function daysUntilDayOfMonth(day: number): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const today = now.getDate();
  const target = new Date(now.getFullYear(), now.getMonth(), day);
  target.setHours(0, 0, 0, 0);
  if (today > day) {
    // Avanzar al próximo mes — usamos el mismo día clamping a fin de mes
    // si el mes siguiente no tiene ese día (ej. day=31 en febrero).
    target.setMonth(target.getMonth() + 1);
    if (target.getDate() !== day) {
      // setDate(day) excedió, retrocedemos al último día del mes anterior
      target.setDate(0);
    }
  }
  const diff = target.getTime() - now.getTime();
  return Math.round(diff / 86400000);
}

interface DueCard {
  account: FinancialAccount;
  daysUntilDue: number;
  daysUntilStatement: number | null;
  daysUntilBureau: number | null;
}

/**
 * Widget que lista tarjetas de crédito (y préstamos) con saldo deudor
 * y configuración de día de pago. Ordenadas por urgencia (menos días
 * primero). Botón "Pagar" abre el PayCardModal directamente.
 */
export default function CreditCardsDue() {
  const accounts = useFinanceStore((s) => s.accounts);
  const [paying, setPaying] = useState<FinancialAccount | null>(null);

  const due: DueCard[] = useMemo(() => {
    return accounts
      .filter(
        (a) =>
          !a.archived &&
          (a.type === "credit" || a.type === "loan") &&
          a.balance > 0 &&
          a.dueDay != null,
      )
      .map((a) => ({
        account: a,
        daysUntilDue: daysUntilDayOfMonth(a.dueDay!),
        daysUntilStatement:
          a.statementDay != null ? daysUntilDayOfMonth(a.statementDay) : null,
        daysUntilBureau:
          a.bureauReportDay != null
            ? daysUntilDayOfMonth(a.bureauReportDay)
            : null,
      }))
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [accounts]);

  // Tarjetas con balance pero SIN dueDay configurado — recordatorio.
  const cardsWithoutDue = accounts.filter(
    (a) =>
      !a.archived &&
      (a.type === "credit" || a.type === "loan") &&
      a.balance > 0 &&
      a.dueDay == null,
  );

  if (due.length === 0 && cardsWithoutDue.length === 0) return null;

  return (
    <>
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={14} className="text-accent" />
          <h3 className="font-serif text-base font-semibold text-brand-dark m-0">
            Próximos pagos de tarjetas
          </h3>
        </div>

        {due.length > 0 && (
          <div className="space-y-2">
            {due.map(({ account, daysUntilDue, daysUntilStatement, daysUntilBureau }) => {
              const urgency =
                daysUntilDue === 0
                  ? "today"
                  : daysUntilDue <= 3
                    ? "critical"
                    : daysUntilDue <= 7
                      ? "warning"
                      : "ok";
              const urgencyClass = {
                today: "bg-danger/10 border-danger/30",
                critical: "bg-warning/10 border-warning/30",
                warning: "bg-brand-warm-white border-brand-tan",
                ok: "bg-brand-warm-white border-brand-cream",
              }[urgency];
              const dueColor = {
                today: "text-danger",
                critical: "text-warning",
                warning: "text-brand-medium",
                ok: "text-brand-warm",
              }[urgency];

              return (
                <div
                  key={account.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition",
                    urgencyClass,
                  )}
                >
                  <span className="text-2xl">{account.icon ?? "💳"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-dark text-sm truncate">
                      {account.name}
                    </p>
                    <p className="text-[11px] text-brand-warm flex items-center gap-2 flex-wrap">
                      <Calendar size={10} />
                      <span className={cn("font-semibold", dueColor)}>
                        {daysUntilDue === 0
                          ? "Vence hoy"
                          : daysUntilDue === 1
                            ? "Vence mañana"
                            : `Vence en ${daysUntilDue} días`}
                      </span>
                      <span className="text-brand-tan">·</span>
                      <span>día {account.dueDay} del mes</span>
                      {account.minPaymentLast != null && account.minPaymentLast > 0 && (
                        <>
                          <span className="text-brand-tan">·</span>
                          <span>
                            mín {formatMoney(account.minPaymentLast, account.currency)}
                          </span>
                        </>
                      )}
                    </p>
                    {(daysUntilStatement != null || daysUntilBureau != null) && (
                      <p className="text-[10px] text-brand-tan mt-0.5">
                        {daysUntilStatement != null && (
                          <span>
                            Corte en {daysUntilStatement}d
                          </span>
                        )}
                        {daysUntilStatement != null && daysUntilBureau != null && " · "}
                        {daysUntilBureau != null && (
                          <span>Reporta buró en {daysUntilBureau}d</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 mr-1">
                    <p className="text-[10px] uppercase tracking-widest text-brand-warm">
                      Saldo
                    </p>
                    <p className="font-bold font-mono text-danger text-sm">
                      {formatMoney(account.balance, account.currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaying(account)}
                    className="shrink-0 px-3 py-1.5 rounded-button text-xs font-semibold bg-accent text-white hover:bg-brand-brown transition"
                  >
                    Pagar
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {cardsWithoutDue.length > 0 && (
          <div className="mt-3 bg-warning/10 border border-warning/30 rounded-md p-2.5 flex items-start gap-2">
            <AlertTriangle size={13} className="text-warning shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="text-brand-medium">
                {cardsWithoutDue.length === 1
                  ? "Tienes 1 tarjeta con saldo pero sin día de pago configurado:"
                  : `Tienes ${cardsWithoutDue.length} tarjetas con saldo pero sin día de pago:`}
                <span className="font-semibold ml-1">
                  {cardsWithoutDue.map((c) => c.name).join(", ")}
                </span>
                .
              </p>
              <p className="text-brand-warm mt-0.5 text-[11px]">
                Configura el día de corte y pago en{" "}
                <strong>Cuentas → Editar</strong> para verlas en este recordatorio.
              </p>
            </div>
          </div>
        )}
      </div>

      <PayCardModal card={paying} onClose={() => setPaying(null)} />
    </>
  );
}
