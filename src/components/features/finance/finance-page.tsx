"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Target,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { cn } from "@/components/ui";
import { useAppStore } from "@/stores/app-store";
import { useFinanceStore } from "@/stores/finance-store";
import PanelView from "./panel-view";
import FlowView from "./flow-view";
import GoalsDebtsView from "./goals-debts-view";
import InvestmentsView from "./investments-view";
import AnalysisView from "./analysis-view";
import AccountsManagerModal from "./accounts-manager-modal";

type View = "panel" | "flow" | "goals" | "investments" | "analysis";

const VIEWS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "panel",       label: "Panel",       icon: LayoutDashboard },
  { id: "flow",        label: "Flujo",       icon: ArrowRightLeft },
  { id: "goals",       label: "Metas & Deudas", icon: Target },
  { id: "investments", label: "Inversiones", icon: TrendingUp },
  { id: "analysis",    label: "Análisis",    icon: PieChart },
];

export default function FinancePage() {
  const financeTab = useAppStore((s) => s.financeTab);
  const setFinanceTab = useAppStore((s) => s.setFinanceTab);
  const { initialize, isLoaded } = useFinanceStore();
  const [showAccountsModal, setShowAccountsModal] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Map legacy tabs a la nueva nomenclatura
  const currentView: View = ((): View => {
    if (["panel", "flow", "goals", "investments", "analysis"].includes(financeTab)) {
      return financeTab as View;
    }
    return "panel";
  })();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 border-b-2 border-brand-cream">
        <div className="flex gap-1 overflow-x-auto">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setFinanceTab(v.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 border-b-2 -mb-[2px] text-sm transition-colors whitespace-nowrap",
                  currentView === v.id
                    ? "border-b-accent text-accent font-semibold"
                    : "border-b-transparent text-brand-medium hover:text-brand-dark"
                )}
              >
                <Icon size={15} />
                {v.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowAccountsModal(true)}
          className="shrink-0 mb-1.5 px-3 py-1.5 rounded-button border border-brand-cream text-brand-medium text-xs hover:bg-brand-cream"
        >
          Cuentas
        </button>
      </div>

      {!isLoaded ? (
        <div className="text-center py-16 text-brand-warm animate-pulse">
          Cargando tus finanzas…
        </div>
      ) : (
        <>
          {currentView === "panel" && <PanelView onManageAccounts={() => setShowAccountsModal(true)} />}
          {currentView === "flow" && <FlowView />}
          {currentView === "goals" && <GoalsDebtsView />}
          {currentView === "investments" && <InvestmentsView />}
          {currentView === "analysis" && <AnalysisView />}
        </>
      )}

      {showAccountsModal && (
        <AccountsManagerModal onClose={() => setShowAccountsModal(false)} />
      )}
    </div>
  );
}
