"use client";

import { useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import {
  TrendingUp, Plus, Trash2, RefreshCw, Bitcoin, LineChart as LineIcon,
  Briefcase, X, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/components/ui";
import { useFinanceStore, type Investment } from "@/stores/finance-store";
import { formatMoney, formatCompact } from "@/lib/finance/format";

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  crypto:      { label: "Crypto",      icon: Bitcoin,     color: "#D4A843" },
  stock:       { label: "Acción",      icon: LineIcon,    color: "#5A8FA8" },
  etf:         { label: "ETF",         icon: Briefcase,   color: "#7A9E3E" },
  bond:        { label: "Bono",        icon: Briefcase,   color: "#8B6542" },
  real_estate: { label: "Real estate", icon: Briefcase,   color: "#C0544F" },
  other:       { label: "Otro",        icon: Briefcase,   color: "#A0845C" },
};

const PIE_COLORS = ["#D4A843", "#B8860B", "#5A8FA8", "#7A9E3E", "#C0544F", "#8B6542", "#D4943A", "#A0845C"];

export default function InvestmentsView() {
  const { investments, createInvestment, updateInvestment, deleteInvestment } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);

  const stats = useMemo(() => {
    const totalValue = investments.reduce(
      (s, i) => s + i.quantity * (i.lastPrice ?? i.averageCost),
      0
    );
    const totalCost = investments.reduce((s, i) => s + i.quantity * i.averageCost, 0);
    const pnl = totalValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

    // Allocation por type
    const byType = new Map<string, number>();
    for (const i of investments) {
      const val = i.quantity * (i.lastPrice ?? i.averageCost);
      byType.set(i.type, (byType.get(i.type) ?? 0) + val);
    }
    const allocation = Array.from(byType.entries()).map(([type, value]) => ({
      type: TYPE_META[type]?.label ?? type,
      value,
      pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));

    // Allocation por símbolo (top 10)
    const bySymbol = investments.map((i) => ({
      symbol: i.symbol,
      name: i.name,
      value: i.quantity * (i.lastPrice ?? i.averageCost),
    })).sort((a, b) => b.value - a.value);

    return { totalValue, totalCost, pnl, pnlPct, allocation, bySymbol };
  }, [investments]);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-dark to-brand-brown rounded-2xl p-6 text-brand-paper">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-light-tan mb-1">
              Portafolio total
            </p>
            <div className="text-5xl font-display font-bold text-accent-glow">
              {formatMoney(stats.totalValue, "USD")}
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-brand-light-cream">
              <span>Cost basis: {formatMoney(stats.totalCost, "USD")}</span>
              <span className={stats.pnl >= 0 ? "text-success" : "text-danger"}>
                P&L: {stats.pnl >= 0 ? "+" : ""}
                {formatMoney(stats.pnl, "USD")}
                {stats.totalCost > 0 && ` (${stats.pnlPct.toFixed(1)}%)`}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="px-4 py-2 rounded-button bg-accent-glow text-brand-dark text-sm font-bold hover:bg-accent flex items-center gap-2"
          >
            <Plus size={14} /> Nueva inversión
          </button>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-12 text-center">
          <TrendingUp size={32} className="mx-auto text-brand-warm mb-3" />
          <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
            Sin inversiones aún
          </h3>
          <p className="text-sm text-brand-warm mb-4">
            Registra acciones, ETFs, crypto, bonos o bienes raíces. Tracking manual por ahora.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown inline-flex items-center gap-2"
          >
            <Plus size={14} /> Primera inversión
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Allocation pie */}
          <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
            <h3 className="font-display text-base font-bold text-brand-dark mb-3">
              Allocation por tipo
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={stats.allocation}
                  dataKey="value"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  label={(e) => `${e.type} ${e.pct.toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats.allocation.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatMoney(v, "USD")} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top holdings */}
          <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
            <h3 className="font-display text-base font-bold text-brand-dark mb-3">
              Top holdings
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {stats.bySymbol.slice(0, 10).map((h) => (
                <div key={h.symbol} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-brand-dark">{h.symbol}</span>
                    <span className="text-brand-warm truncate">{h.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-brand-dark">
                    {formatMoney(h.value, "USD")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Holdings list */}
      {investments.length > 0 && (
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base font-bold text-brand-dark">
              Holdings detallados
            </h3>
            <span className="text-[11px] text-brand-tan italic">
              Precios manuales · integración API en roadmap
            </span>
          </div>
          <div className="space-y-2">
            {investments.map((inv) => (
              <HoldingRow
                key={inv.id}
                investment={inv}
                onEdit={() => {
                  setEditing(inv);
                  setShowForm(true);
                }}
                onDelete={async () => {
                  if (!confirm(`¿Borrar ${inv.symbol}?`)) return;
                  await deleteInvestment(inv.id);
                  toast.success("Borrada");
                }}
                onUpdatePrice={async (newPrice) => {
                  await updateInvestment(inv.id, { lastPrice: newPrice });
                  toast.success("Precio actualizado");
                }}
              />
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <InvestmentFormModal
          investment={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={async (data) => {
            if (editing) {
              await updateInvestment(editing.id, data);
              toast.success("Actualizada");
            } else {
              await createInvestment(data as Parameters<typeof createInvestment>[0]);
              toast.success("Inversión agregada");
            }
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function HoldingRow({
  investment,
  onEdit,
  onDelete,
  onUpdatePrice,
}: {
  investment: Investment;
  onEdit: () => void;
  onDelete: () => void;
  onUpdatePrice: (price: number) => Promise<void>;
}) {
  const [editPrice, setEditPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(String(investment.lastPrice ?? investment.averageCost));
  const meta = TYPE_META[investment.type];
  const currentPrice = investment.lastPrice ?? investment.averageCost;
  const value = investment.quantity * currentPrice;
  const cost = investment.quantity * investment.averageCost;
  const pnl = value - cost;
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 border border-brand-cream rounded-lg hover:border-accent/40 transition group">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${meta?.color ?? "#A0845C"}20`, color: meta?.color ?? "#A0845C" }}
      >
        <meta.icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-brand-dark">{investment.symbol}</span>
          <span className="text-[10px] uppercase tracking-wider text-brand-warm">{meta?.label}</span>
        </div>
        <p className="text-[11px] text-brand-warm truncate">
          {investment.name} · {investment.quantity} × {formatMoney(investment.averageCost, investment.currency)}
        </p>
      </div>
      <div className="text-right shrink-0 min-w-[100px]">
        {editPrice ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-20 px-2 py-1 text-xs rounded border border-accent bg-brand-paper focus:outline-none"
            />
            <button
              onClick={async () => {
                await onUpdatePrice(parseFloat(newPrice) || 0);
                setEditPrice(false);
              }}
              className="p-1 bg-accent text-white rounded"
              title="Guardar"
            >
              <RefreshCw size={10} />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-bold text-brand-dark">
              {formatMoney(value, investment.currency)}
            </p>
            <p className={cn(
              "text-[11px] font-semibold",
              pnl >= 0 ? "text-success" : "text-danger"
            )}>
              {pnl >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
            </p>
          </>
        )}
      </div>
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={() => setEditPrice(!editPrice)}
          className="p-1 text-brand-warm hover:text-accent rounded transition"
          title="Actualizar precio"
        >
          <RefreshCw size={11} />
        </button>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-brand-warm hover:text-danger rounded transition"
          title="Borrar"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

function InvestmentFormModal({
  investment,
  onClose,
  onSave,
}: {
  investment: Investment | null;
  onClose: () => void;
  onSave: (data: Partial<Investment> & { symbol: string; name: string; type: string; quantity: number; averageCost: number }) => Promise<void>;
}) {
  const [symbol, setSymbol] = useState(investment?.symbol ?? "");
  const [name, setName] = useState(investment?.name ?? "");
  const [type, setType] = useState(investment?.type ?? "stock");
  const [quantity, setQuantity] = useState(String(investment?.quantity ?? ""));
  const [averageCost, setAverageCost] = useState(String(investment?.averageCost ?? ""));
  const [lastPrice, setLastPrice] = useState(String(investment?.lastPrice ?? ""));
  const [currency, setCurrency] = useState(investment?.currency ?? "USD");
  const [saving, setSaving] = useState(false);

  async function save() {
    const q = parseFloat(quantity);
    const ac = parseFloat(averageCost);
    if (!symbol.trim() || !name.trim() || !q || q <= 0 || !ac || ac <= 0) {
      toast.error("Datos incompletos");
      return;
    }
    setSaving(true);
    await onSave({
      symbol: symbol.trim().toUpperCase(),
      name: name.trim(),
      type,
      quantity: q,
      averageCost: ac,
      lastPrice: lastPrice ? parseFloat(lastPrice) : ac,
      currency,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg my-8" onClick={(e) => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-brand-cream flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-brand-dark m-0">
            {investment ? "Editar" : "Nueva"} inversión
          </h2>
          <button onClick={onClose} className="p-1.5 text-brand-warm hover:bg-brand-cream rounded-full">
            <X size={16} />
          </button>
        </header>
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="AAPL"
              autoFocus
              maxLength={10}
              className="w-24 px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono font-bold focus:outline-none focus:border-accent"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              className="px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
              Tipo
            </label>
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(TYPE_META).map(([t, m]) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "py-1.5 rounded text-xs font-medium transition",
                    type === t ? "bg-accent text-white" : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                Cantidad
              </label>
              <input
                type="number"
                step="0.00001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                Precio promedio compra
              </label>
              <input
                type="number"
                step="0.01"
                value={averageCost}
                onChange={(e) => setAverageCost(e.target.value)}
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                Precio actual (opc)
              </label>
              <input
                type="number"
                step="0.01"
                value={lastPrice}
                onChange={(e) => setLastPrice(e.target.value)}
                placeholder="Si está vacío usa el promedio"
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
              >
                {["USD", "MXN", "EUR", "GBP", "BTC", "ETH"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <footer className="px-6 py-3 border-t border-brand-cream flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown disabled:opacity-40 flex items-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            {investment ? "Guardar" : "Crear"}
          </button>
        </footer>
      </div>
    </div>
  );
}
