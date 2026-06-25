"use client";

import { useEffect, useState } from "react";
import { Tabs } from "@/components/ui";
import { useAppStore } from "@/stores/app-store";
import { useFinanceStore } from "@/stores/finance-store";
import PanelView from "./panel-view";
import FlowView from "./flow-view";
import GoalsDebtsView from "./goals-debts-view";
import InvestmentsView from "./investments-view";
import AnalysisView from "./analysis-view";
import AccountsManagerModal from "./accounts-manager-modal";

type View = "panel" | "flow" | "goals" | "investments" | "analysis";

const VIEWS: { id: View; label: string }[] = [
  { id: "panel",       label: "Panel" },
  { id: "flow",        label: "Flujo" },
  { id: "goals",       label: "Metas & Deudas" },
  { id: "investments", label: "Inversiones" },
  { id: "analysis",    label: "Análisis" },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          tabs={VIEWS}
          activeTab={currentView}
          onChange={(id) => setFinanceTab(id)}
          variant="segmented"
          className="overflow-x-auto"
        />
        <button
          onClick={() => setShowAccountsModal(true)}
          className="shrink-0 px-3 py-1.5 rounded-button border border-brand-cream text-brand-medium text-xs hover:bg-brand-cream"
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
