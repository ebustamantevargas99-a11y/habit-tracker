"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import {
  DollarSign, TrendingUp, PiggyBank, CreditCard, Receipt,
  Plus, Trash2, Check, Clock, AlertTriangle, Star, ShoppingBag,
  Repeat, Calendar, ArrowUpRight, ArrowDownRight, Target, BarChart2,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

interface BudgetItem {
  category: string;
  emoji: string;
  spent: number;
  budget: number;
}

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: "pagado" | "pendiente" | "vencido";
  category: string;
}

interface Subscription {
  id: string;
  name: string;
  costMonth: number;
  category: string;
  renewalDate: string;
  active: boolean;
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  priority: "Necesito" | "Quiero";
  saved: number;
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SAMPLE_INCOME: Transaction[] = [
  { id: "i1", date: "2026-04-01", description: "Salario", amount: 4500, category: "Salario" },
  { id: "i2", date: "2026-04-05", description: "Proyecto freelance", amount: 800, category: "Freelance" },
  { id: "i3", date: "2026-03-15", description: "Dividendos", amount: 120, category: "Inversiones" },
  { id: "i4", date: "2026-03-01", description: "Salario", amount: 4500, category: "Salario" },
  { id: "i5", date: "2026-02-01", description: "Salario", amount: 4500, category: "Salario" },
  { id: "i6", date: "2026-02-20", description: "Consultoría", amount: 600, category: "Freelance" },
];

const SAMPLE_EXPENSES: Transaction[] = [
  { id: "e1", date: "2026-04-05", description: "Supermercado", amount: 85, category: "Alimentación" },
  { id: "e2", date: "2026-04-04", description: "Gasolina", amount: 65, category: "Transporte" },
  { id: "e3", date: "2026-04-04", description: "Cine", amount: 30, category: "Entretenimiento" },
  { id: "e4", date: "2026-04-03", description: "Farmacia", amount: 45, category: "Salud" },
  { id: "e5", date: "2026-04-03", description: "Curso online", amount: 75, category: "Educación" },
  { id: "e6", date: "2026-04-02", description: "Ropa deportiva", amount: 120, category: "Ropa" },
  { id: "e7", date: "2026-04-02", description: "Electricidad", amount: 95, category: "Servicios" },
  { id: "e8", date: "2026-04-01", description: "Restaurante", amount: 72, category: "Alimentación" },
  { id: "e9", date: "2026-03-31", description: "Internet", amount: 50, category: "Servicios" },
  { id: "e10", date: "2026-03-30", description: "Gym membership", amount: 40, category: "Salud" },
];

const SAMPLE_BUDGETS: BudgetItem[] = [
  { category: "Alimentación", emoji: "🍔", spent: 450, budget: 500 },
  { category: "Transporte", emoji: "🚗", spent: 280, budget: 300 },
  { category: "Entretenimiento", emoji: "🎬", spent: 200, budget: 250 },
  { category: "Salud", emoji: "🏥", spent: 150, budget: 200 },
  { category: "Educación", emoji: "📚", spent: 300, budget: 400 },
  { category: "Ropa", emoji: "👕", spent: 180, budget: 200 },
  { category: "Servicios", emoji: "💡", spent: 420, budget: 450 },
  { category: "Otros", emoji: "📦", spent: 220, budget: 300 },
];

const SAMPLE_BILLS: Bill[] = [
  { id: "b1", name: "Alquiler", amount: 1200, dueDate: "2026-04-01", status: "pagado", category: "Vivienda" },
  { id: "b2", name: "Electricidad", amount: 95, dueDate: "2026-04-10", status: "pendiente", category: "Servicios" },
  { id: "b3", name: "Internet", amount: 50, dueDate: "2026-04-15", status: "pendiente", category: "Servicios" },
  { id: "b4", name: "Seguro Auto", amount: 180, dueDate: "2026-04-20", status: "pendiente", category: "Seguros" },
  { id: "b5", name: "Teléfono", amount: 45, dueDate: "2026-04-05", status: "pagado", category: "Servicios" },
  { id: "b6", name: "Agua", amount: 35, dueDate: "2026-03-28", status: "vencido", category: "Servicios" },
];

const SAMPLE_SUBS: Subscription[] = [
  { id: "s1", name: "Netflix", costMonth: 15.99, category: "Entretenimiento", renewalDate: "2026-04-12", active: true },
  { id: "s2", name: "Spotify", costMonth: 9.99, category: "Entretenimiento", renewalDate: "2026-04-18", active: true },
  { id: "s3", name: "Gym", costMonth: 40, category: "Salud", renewalDate: "2026-05-01", active: true },
  { id: "s4", name: "iCloud", costMonth: 2.99, category: "Tecnología", renewalDate: "2026-04-22", active: true },
  { id: "s5", name: "ChatGPT Plus", costMonth: 20, category: "Productividad", renewalDate: "2026-04-15", active: true },
  { id: "s6", name: "Adobe CC", costMonth: 54.99, category: "Productividad", renewalDate: "2026-05-05", active: true },
];

const SAMPLE_WISHLIST: WishlistItem[] = [
  { id: "w1", name: "MacBook Pro M4", price: 2499, priority: "Necesito", saved: 1200 },
  { id: "w2", name: "AirPods Pro", price: 249, priority: "Quiero", saved: 100 },
  { id: "w3", name: "Standing Desk", price: 450, priority: "Necesito", saved: 300 },
  { id: "w4", name: "Cámara Sony A7IV", price: 1800, priority: "Quiero", saved: 400 },
];

const MONTHLY_TREND = [
  { month: "Nov", income: 4500, expenses: 3100 },
  { month: "Dic", income: 5200, expenses: 3800 },
  { month: "Ene", income: 4500, expenses: 2900 },
  { month: "Feb", income: 5100, expenses: 3200 },
  { month: "Mar", income: 4620, expenses: 3050 },
  { month: "Abr", income: 5300, expenses: 3200 },
];

// ============================================================================
// TAB 1: RESUMEN (Overview)
// ============================================================================

function OverviewTab() {
  const totalIncome = 5300;
  const totalExpenses = 3200;
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = Math.round((netSavings / totalIncome) * 100);

  const catBreakdown = SAMPLE_BUDGETS.map((b) => ({
    name: b.category,
    value: b.spent,
    emoji: b.emoji,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Ingresos", value: `$${totalIncome.toLocaleString()}`, icon: ArrowUpRight, colorClass: "text-success", bgClass: "bg-success/10 border-2 border-success" },
          { label: "Gastos", value: `$${totalExpenses.toLocaleString()}`, icon: ArrowDownRight, colorClass: "text-danger", bgClass: "bg-danger/10 border-2 border-danger" },
          { label: "Ahorro Neto", value: `$${netSavings.toLocaleString()}`, icon: PiggyBank, colorClass: "text-accent", bgClass: "bg-accent/10 border-2 border-accent" },
          { label: "Tasa de Ahorro", value: `${savingsRate}%`, icon: Target, colorClass: "text-info", bgClass: "bg-info/10 border-2 border-info" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.bgClass} rounded-xl p-5`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className={card.colorClass} />
                <span className="text-xs font-semibold text-brand-dark">{card.label}</span>
              </div>
              <div className={`text-3xl font-bold font-serif ${card.colorClass}`}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Monthly Trend */}
        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5">
          <h3 className="text-sm font-semibold text-brand-dark mb-4">
            Tendencia Mensual (6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5EDE3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#FAF7F3", border: "1px solid #C4A882", borderRadius: "8px" }} />
              <Bar dataKey="income" fill="#7A9E3E" name="Ingresos" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#C0544F" name="Gastos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Savings Trend */}
        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5">
          <h3 className="text-sm font-semibold text-brand-dark mb-4">
            Evolución del Ahorro
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MONTHLY_TREND.map((m) => ({ ...m, savings: m.income - m.expenses }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5EDE3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#FAF7F3", border: "1px solid #C4A882", borderRadius: "8px" }} />
              <Line type="monotone" dataKey="savings" stroke="#B8860B" strokeWidth={3} dot={{ fill: "#B8860B", r: 5 }} name="Ahorro" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5">
        <h3 className="text-sm font-semibold text-brand-dark mb-4">
          Desglose de Gastos por Categoría
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {catBreakdown.map((cat) => {
            const pct = Math.round((cat.value / totalExpenses) * 100);
            return (
              <div key={cat.name} className="bg-brand-light-cream rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <div className="text-xs font-semibold text-brand-dark">{cat.name}</div>
                <div className="text-xl font-bold text-brand-brown font-serif">
                  ${cat.value}
                </div>
                <div className="text-[11px] text-brand-warm">{pct}% del total</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 2: INGRESOS
// ============================================================================

function IncomeTab() {
  const [incomes, setIncomes] = useState<Transaction[]>(SAMPLE_INCOME);
  const [showForm, setShowForm] = useState(false);
  const [newIncome, setNewIncome] = useState({ description: "", amount: "", category: "Salario", date: "2026-04-05" });

  const total = incomes.reduce((s, i) => s + i.amount, 0);
  const categories = ["Salario", "Freelance", "Inversiones", "Regalos", "Otros"];

  const addIncome = () => {
    if (!newIncome.description || !newIncome.amount) return;
    setIncomes([
      { id: `i${Date.now()}`, date: newIncome.date, description: newIncome.description, amount: parseFloat(newIncome.amount), category: newIncome.category },
      ...incomes,
    ]);
    setNewIncome({ description: "", amount: "", category: "Salario", date: "2026-04-05" });
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div className="bg-success/10 border-2 border-success rounded-xl px-6 py-4">
          <span className="text-xs text-brand-dark font-semibold">Total Ingresos</span>
          <div className="text-3xl font-bold text-success font-serif">
            ${total.toLocaleString()}
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-5 py-2.5 bg-accent text-brand-paper rounded-lg font-semibold text-sm cursor-pointer border-none">
          <Plus size={16} /> Agregar Ingreso
        </button>
      </div>

      {showForm && (
        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5 grid gap-3 items-end [grid-template-columns:1fr_1fr_1fr_1fr_auto]">
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Descripción</label>
            <input value={newIncome.description} onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Monto ($)</label>
            <input type="number" value={newIncome.amount} onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Categoría</label>
            <select value={newIncome.category} onChange={(e) => setNewIncome({ ...newIncome, category: e.target.value })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Fecha</label>
            <input type="date" value={newIncome.date} onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]" />
          </div>
          <button onClick={addIncome} className="px-4 py-2 bg-success text-brand-paper rounded-md cursor-pointer font-semibold border-none">
            <Check size={16} />
          </button>
        </div>
      )}

      <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-brand-dark border-b-2 border-brand-tan uppercase">Fecha</th>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-brand-dark border-b-2 border-brand-tan uppercase">Descripción</th>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-brand-dark border-b-2 border-brand-tan uppercase">Categoría</th>
              <th className="px-3 py-3 text-right text-[12px] font-semibold text-brand-dark border-b-2 border-brand-tan uppercase">Monto</th>
              <th className="px-3 py-3 text-center text-[12px] font-semibold text-brand-dark border-b-2 border-brand-tan uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {incomes.map((tx) => (
              <tr key={tx.id}>
                <td className="px-3 py-3 text-[13px] border-b border-brand-light-cream text-brand-warm">{tx.date}</td>
                <td className="px-3 py-3 text-[13px] border-b border-brand-light-cream font-medium text-brand-dark">{tx.description}</td>
                <td className="px-3 py-3 text-[13px] border-b border-brand-light-cream">
                  <span className="bg-success/10 text-success px-2.5 py-1 rounded-xl text-[11px] font-semibold">
                    {tx.category}
                  </span>
                </td>
                <td className="px-3 py-3 text-[13px] border-b border-brand-light-cream text-right font-semibold text-success">
                  +${tx.amount.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-[13px] border-b border-brand-light-cream text-center">
                  <button onClick={() => setIncomes(incomes.filter((i) => i.id !== tx.id))} className="bg-transparent border-none cursor-pointer text-danger opacity-60">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 3: GASTOS
// ============================================================================

function ExpensesTab() {
  const [expenses, setExpenses] = useState<Transaction[]>(SAMPLE_EXPENSES);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("Todos");
  const [newExp, setNewExp] = useState({ description: "", amount: "", category: "Alimentación", date: "2026-04-05" });

  const categories = ["Alimentación", "Transporte", "Entretenimiento", "Salud", "Educación", "Ropa", "Servicios", "Otros"];
  const filtered = filter === "Todos" ? expenses : expenses.filter((e) => e.category === filter);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const addExpense = () => {
    if (!newExp.description || !newExp.amount) return;
    setExpenses([
      { id: `e${Date.now()}`, date: newExp.date, description: newExp.description, amount: parseFloat(newExp.amount), category: newExp.category },
      ...expenses,
    ]);
    setNewExp({ description: "", amount: "", category: "Alimentación", date: "2026-04-05" });
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div className="flex gap-3 items-center">
          <div className="bg-danger/10 border-2 border-danger rounded-xl px-6 py-4">
            <span className="text-xs text-brand-dark font-semibold">Total Gastos</span>
            <div className="text-3xl font-bold text-danger font-serif">
              ${total.toLocaleString()}
            </div>
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2.5 border border-brand-tan rounded-lg text-[13px] bg-brand-paper">
            <option value="Todos">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-5 py-2.5 bg-accent text-brand-paper rounded-lg font-semibold text-sm cursor-pointer border-none">
          <Plus size={16} /> Agregar Gasto
        </button>
      </div>

      {showForm && (
        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5 grid gap-3 items-end [grid-template-columns:1fr_1fr_1fr_1fr_auto]">
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Descripción</label>
            <input value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Monto ($)</label>
            <input type="number" value={newExp.amount} onChange={(e) => setNewExp({ ...newExp, amount: e.target.value })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Categoría</label>
            <select value={newExp.category} onChange={(e) => setNewExp({ ...newExp, category: e.target.value })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Fecha</label>
            <input type="date" value={newExp.date} onChange={(e) => setNewExp({ ...newExp, date: e.target.value })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]" />
          </div>
          <button onClick={addExpense} className="px-4 py-2 bg-danger text-brand-paper rounded-md cursor-pointer font-semibold border-none">
            <Check size={16} />
          </button>
        </div>
      )}

      <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-brand-dark border-b-2 border-brand-tan uppercase">Fecha</th>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-brand-dark border-b-2 border-brand-tan uppercase">Descripción</th>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-brand-dark border-b-2 border-brand-tan uppercase">Categoría</th>
              <th className="px-3 py-3 text-right text-[12px] font-semibold text-brand-dark border-b-2 border-brand-tan uppercase">Monto</th>
              <th className="px-3 py-3 text-center text-[12px] font-semibold text-brand-dark border-b-2 border-brand-tan uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td className="px-3 py-3 text-[13px] border-b border-brand-light-cream text-brand-warm">{tx.date}</td>
                <td className="px-3 py-3 text-[13px] border-b border-brand-light-cream font-medium text-brand-dark">{tx.description}</td>
                <td className="px-3 py-3 text-[13px] border-b border-brand-light-cream">
                  <span className="bg-warning/10 text-warning px-2.5 py-1 rounded-xl text-[11px] font-semibold">
                    {tx.category}
                  </span>
                </td>
                <td className="px-3 py-3 text-[13px] border-b border-brand-light-cream text-right font-semibold text-danger">
                  -${tx.amount.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-[13px] border-b border-brand-light-cream text-center">
                  <button onClick={() => setExpenses(expenses.filter((e) => e.id !== tx.id))} className="bg-transparent border-none cursor-pointer text-danger opacity-60">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 4: PRESUPUESTO
// ============================================================================

function BudgetTab() {
  const budgets = SAMPLE_BUDGETS;
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const adherence = Math.round((1 - (totalSpent - totalBudget * 0.85) / totalBudget) * 100);

  const getColorClass = (spent: number, budget: number) => {
    const pct = (spent / budget) * 100;
    if (pct > 90) return "bg-danger";
    if (pct > 75) return "bg-warning";
    return "bg-success";
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Adherence Gauge */}
      <div className="flex gap-5 items-center">
        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5 text-center min-w-[180px]">
          <div className="relative w-[120px] h-[120px] mx-auto mb-3">
            <svg width="120" height="120" className="-rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#F5EDE3" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#B8860B" strokeWidth="8" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - Math.min(adherence, 100) / 100)} strokeLinecap="round" />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="text-3xl font-bold font-serif text-brand-dark">{adherence}%</div>
            </div>
          </div>
          <div className="text-[13px] font-semibold text-brand-dark">Adherencia</div>
          <div className="text-[11px] text-brand-warm">al presupuesto</div>
        </div>

        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5 flex-1">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-[11px] text-brand-warm mb-1">Presupuesto Total</div>
              <div className="text-2xl font-bold font-serif text-brand-dark">
                ${totalBudget.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-brand-warm mb-1">Gastado</div>
              <div className="text-2xl font-bold font-serif text-danger">
                ${totalSpent.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-brand-warm mb-1">Restante</div>
              <div className="text-2xl font-bold font-serif text-success">
                ${(totalBudget - totalSpent).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Bars */}
      <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5">
        <h3 className="text-sm font-semibold text-brand-dark mb-5">Progreso por Categoría</h3>
        <div className="flex flex-col gap-4">
          {budgets.map((b) => {
            const pct = Math.round((b.spent / b.budget) * 100);
            const colorClass = getColorClass(b.spent, b.budget);
            return (
              <div key={b.category}>
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{b.emoji}</span>
                    <span className="text-[13px] font-semibold text-brand-dark">{b.category}</span>
                  </div>
                  <span className="text-xs text-brand-warm">
                    ${b.spent} / ${b.budget} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-brand-light-cream rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 5: FACTURAS
// ============================================================================

function BillsTab() {
  const [bills, setBills] = useState<Bill[]>(SAMPLE_BILLS);

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "pagado": return "bg-success/10 text-success";
      case "pendiente": return "bg-warning/10 text-warning";
      case "vencido": return "bg-danger/10 text-danger";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pagado": return <Check size={14} />;
      case "pendiente": return <Clock size={14} />;
      case "vencido": return <AlertTriangle size={14} />;
      default: return null;
    }
  };

  const totalMonthly = bills.reduce((s, b) => s + b.amount, 0);
  const paid = bills.filter((b) => b.status === "pagado").reduce((s, b) => s + b.amount, 0);
  const pending = bills.filter((b) => b.status !== "pagado").reduce((s, b) => s + b.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5 text-center">
          <div className="text-[11px] text-brand-warm mb-1">Total Mensual</div>
          <div className="text-2xl font-bold font-serif text-brand-dark">${totalMonthly.toLocaleString()}</div>
        </div>
        <div className="bg-success/10 border border-brand-light-cream rounded-xl p-5 text-center">
          <div className="text-[11px] text-success mb-1">Pagado</div>
          <div className="text-2xl font-bold font-serif text-success">${paid.toLocaleString()}</div>
        </div>
        <div className="bg-warning/10 border border-brand-light-cream rounded-xl p-5 text-center">
          <div className="text-[11px] text-warning mb-1">Pendiente</div>
          <div className="text-2xl font-bold font-serif text-warning">${pending.toLocaleString()}</div>
        </div>
      </div>

      {/* Bill Cards */}
      <div className="grid grid-cols-3 gap-4">
        {bills.map((bill) => {
          const statusClasses = getStatusClasses(bill.status);
          return (
            <div key={bill.id} className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5 relative">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-[15px] font-semibold text-brand-dark">{bill.name}</div>
                  <div className="text-[11px] text-brand-warm">{bill.category}</div>
                </div>
                <span className={`${statusClasses} px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1`}>
                  {getStatusIcon(bill.status)} {bill.status}
                </span>
              </div>
              <div className="text-2xl font-bold font-serif text-brand-brown mb-2">
                ${bill.amount}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-warm">
                <Calendar size={12} />
                Vence: {bill.dueDate}
              </div>
              {bill.status === "pendiente" && (
                <button onClick={() => setBills(bills.map((b) => b.id === bill.id ? { ...b, status: "pagado" as const } : b))} className="mt-3 w-full py-2 bg-success text-brand-paper rounded-md cursor-pointer font-semibold text-xs border-none">
                  Marcar como Pagado
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 6: SUSCRIPCIONES
// ============================================================================

function SubscriptionsTab() {
  const [subs, setSubs] = useState<Subscription[]>(SAMPLE_SUBS);

  const activeSubs = subs.filter((s) => s.active);
  const totalMonthly = activeSubs.reduce((s, sub) => s + sub.costMonth, 0);
  const totalAnnual = totalMonthly * 12;

  return (
    <div className="flex flex-col gap-5">
      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5 text-center">
          <Repeat size={20} className="text-accent mx-auto mb-2 block" />
          <div className="text-[11px] text-brand-warm mb-1">Suscripciones Activas</div>
          <div className="text-3xl font-bold font-serif text-brand-dark">{activeSubs.length}</div>
        </div>
        <div className="bg-accent/10 border border-brand-light-cream rounded-xl p-5 text-center">
          <div className="text-[11px] text-brand-brown mb-1">Costo Mensual</div>
          <div className="text-3xl font-bold font-serif text-accent">
            ${totalMonthly.toFixed(2)}
          </div>
        </div>
        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5 text-center">
          <div className="text-[11px] text-brand-warm mb-1">Costo Anual</div>
          <div className="text-3xl font-bold font-serif text-danger">
            ${totalAnnual.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Subscription Cards */}
      <div className="grid grid-cols-3 gap-4">
        {subs.map((sub) => (
          <div key={sub.id} className={`bg-brand-warm-white border border-brand-light-cream rounded-xl p-5 ${sub.active ? "opacity-100" : "opacity-50"}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-base font-semibold text-brand-dark">{sub.name}</div>
                <span className="text-[11px] text-brand-warm bg-brand-light-cream px-2 py-0.5 rounded-lg">
                  {sub.category}
                </span>
              </div>
              <div className="text-[22px] font-bold font-serif text-accent">
                ${sub.costMonth}
              </div>
            </div>
            <div className="text-[11px] text-brand-warm mb-3">
              /mes · Renueva: {sub.renewalDate}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSubs(subs.map((s) => s.id === sub.id ? { ...s, active: !s.active } : s))} className={`flex-1 py-2 rounded-md cursor-pointer font-semibold text-[11px] border-none ${sub.active ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
                {sub.active ? "Cancelar" : "Reactivar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 7: LISTA DE DESEOS
// ============================================================================

function WishlistTab() {
  const [items, setItems] = useState<WishlistItem[]>(SAMPLE_WISHLIST);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState<{ name: string; price: string; priority: "Necesito" | "Quiero"; saved: string }>({ name: "", price: "", priority: "Quiero", saved: "0" });

  const addItem = () => {
    if (!newItem.name || !newItem.price) return;
    setItems([...items, { id: `w${Date.now()}`, name: newItem.name, price: parseFloat(newItem.price), priority: newItem.priority, saved: parseFloat(newItem.saved) || 0 }]);
    setNewItem({ name: "", price: "", priority: "Quiero", saved: "0" });
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-5 py-2.5 bg-accent text-brand-paper rounded-lg font-semibold text-sm cursor-pointer border-none">
          <Plus size={16} /> Agregar Deseo
        </button>
      </div>

      {showForm && (
        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5 grid gap-3 items-end [grid-template-columns:1fr_1fr_1fr_1fr_auto]">
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Nombre</label>
            <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Precio ($)</label>
            <input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Prioridad</label>
            <select value={newItem.priority} onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as "Necesito" | "Quiero" })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]">
              <option value="Necesito">Necesito</option>
              <option value="Quiero">Quiero</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-brand-warm mb-1">Ahorrado ($)</label>
            <input type="number" value={newItem.saved} onChange={(e) => setNewItem({ ...newItem, saved: e.target.value })} className="w-full px-2 py-2 border border-brand-tan rounded-md text-[13px]" />
          </div>
          <button onClick={addItem} className="px-4 py-2 bg-accent text-brand-paper rounded-md cursor-pointer font-semibold border-none">
            <Check size={16} />
          </button>
        </div>
      )}

      {/* Wishlist Cards */}
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => {
          const pct = Math.round((item.saved / item.price) * 100);
          return (
            <div key={item.id} className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-base font-semibold text-brand-dark">{item.name}</div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-xl ${item.priority === "Necesito" ? "bg-danger/10 text-danger" : "bg-info/10 text-info"}`}>
                    {item.priority}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[22px] font-bold font-serif text-accent">
                    ${item.price.toLocaleString()}
                  </div>
                  <button onClick={() => setItems(items.filter((i) => i.id !== item.id))} className="bg-transparent border-none cursor-pointer text-danger opacity-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-brand-warm">Ahorrado: ${item.saved.toLocaleString()}</span>
                <span className="font-semibold text-accent">{pct}%</span>
              </div>
              <div className="w-full h-2.5 bg-brand-light-cream rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-accent to-accent-light" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[11px] text-brand-warm mt-1.5">
                Faltan: ${(item.price - item.saved).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN FINANCE PAGE
// ============================================================================

// ============== ANALYTICS TAB ==============
function AnalyticsTab() {
  const expenseByCategory = [
    { name: 'Vivienda', value: 1200, color: '#E74C3C' },
    { name: 'Alimentación', value: 600, color: '#F39C12' },
    { name: 'Transporte', value: 350, color: '#3498DB' },
    { name: 'Entretenimiento', value: 200, color: '#9B59B6' },
    { name: 'Salud', value: 180, color: '#27AE60' },
    { name: 'Educación', value: 150, color: '#1ABC9C' },
    { name: 'Ropa', value: 120, color: '#E67E22' },
    { name: 'Otros', value: 100, color: '#95A5A6' },
  ];

  const incomeBySource = [
    { name: 'Salario', value: 3500, color: '#27AE60' },
    { name: 'Freelance', value: 800, color: '#3498DB' },
    { name: 'Inversiones', value: 300, color: '#F39C12' },
    { name: 'Otros', value: 150, color: '#95A5A6' },
  ];

  const monthlyTrend = [
    { mes: 'Oct', ingresos: 4200, gastos: 2700, ahorro: 1500 },
    { mes: 'Nov', ingresos: 4500, gastos: 2900, ahorro: 1600 },
    { mes: 'Dic', ingresos: 5100, gastos: 3800, ahorro: 1300 },
    { mes: 'Ene', ingresos: 4300, gastos: 2800, ahorro: 1500 },
    { mes: 'Feb', ingresos: 4600, gastos: 2600, ahorro: 2000 },
    { mes: 'Mar', ingresos: 4750, gastos: 2900, ahorro: 1850 },
  ];

  const totalExpense = expenseByCategory.reduce((s, c) => s + c.value, 0);
  const totalIncome = incomeBySource.reduce((s, c) => s + c.value, 0);
  const savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Ingresos', value: `$${totalIncome.toLocaleString()}`, color: 'text-success', emoji: '📈' },
          { label: 'Gastos', value: `$${totalExpense.toLocaleString()}`, color: 'text-danger', emoji: '📉' },
          { label: 'Ahorro', value: `$${(totalIncome - totalExpense).toLocaleString()}`, color: 'text-info', emoji: '💰' },
          { label: 'Tasa de Ahorro', value: `${savingsRate}%`, color: 'text-accent', emoji: '🎯' },
        ].map((s, i) => (
          <div key={i} className="bg-brand-paper border border-brand-light-cream rounded-xl p-5 text-center shadow-sm">
            <span className="text-2xl">{s.emoji}</span>
            <div className={`text-[1.4rem] font-bold ${s.color} my-2`}>{s.value}</div>
            <div className="text-[0.8rem] text-brand-warm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Expense by Category - Pie */}
        <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5 shadow-sm">
          <h3 className="font-serif text-brand-dark mb-4 text-base">
            💳 Gastos por Categoría
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {expenseByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Income by Source - Pie */}
        <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5 shadow-sm">
          <h3 className="font-serif text-brand-dark mb-4 text-base">
            📊 Ingresos por Fuente
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={incomeBySource} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {incomeBySource.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5 shadow-sm">
        <h3 className="font-serif text-brand-dark mb-4 text-base">
          📈 Tendencia Mensual (6 meses)
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F5EDE3" />
            <XAxis dataKey="mes" tick={{ fill: "#A0845C", fontSize: 12 }} />
            <YAxis tick={{ fill: "#A0845C", fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: "1px solid #C4A882" }} />
            <Legend />
            <Bar dataKey="ingresos" name="Ingresos" fill="#7A9E3E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" name="Gastos" fill="#C0544F" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ahorro" name="Ahorro" fill="#5A8FA8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown Table */}
      <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5 shadow-sm">
        <h3 className="font-serif text-brand-dark mb-4 text-base">
          📋 Desglose de Gastos
        </h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-brand-cream">
              {['Categoría', 'Monto', '% del Total', 'Progreso'].map(h => (
                <th key={h} className="px-3.5 py-2.5 text-left text-[0.8rem] text-brand-warm font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenseByCategory.sort((a, b) => b.value - a.value).map((cat, i) => {
              const pct = Math.round((cat.value / totalExpense) * 100);
              return (
                <tr key={i} className="border-b border-brand-light-cream">
                  <td className="px-3.5 py-2.5 text-[0.9rem] text-brand-dark font-medium">
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </td>
                  <td className="px-3.5 py-2.5 text-[0.9rem] text-brand-dark font-semibold">${cat.value.toLocaleString()}</td>
                  <td className="px-3.5 py-2.5 text-[0.85rem] text-brand-warm">{pct}%</td>
                  <td className="px-3.5 py-2.5">
                    <div className="w-full h-2 bg-brand-light-cream rounded overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TABS = [
  { id: "resumen", label: "Resumen", icon: TrendingUp },
  { id: "ingresos", label: "Ingresos", icon: ArrowUpRight },
  { id: "gastos", label: "Gastos", icon: ArrowDownRight },
  { id: "presupuesto", label: "Presupuesto", icon: Target },
  { id: "facturas", label: "Facturas", icon: Receipt },
  { id: "suscripciones", label: "Suscripciones", icon: Repeat },
  { id: "deseos", label: "Lista de Deseos", icon: Star },
  { id: "analytics", label: "Análisis", icon: BarChart2 },
];

const BudgetTrackerPage = () => {
  const activeTab = useAppStore((s) => s.financeTab);
  const setActiveTab = useAppStore((s) => s.setFinanceTab);

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b-2 border-brand-light-cream pb-0 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] whitespace-nowrap rounded-t-lg border-none cursor-pointer transition-all duration-200 ${
                isActive
                  ? "bg-accent text-brand-paper font-bold border-b-[3px] border-b-accent"
                  : "bg-transparent text-brand-warm font-medium border-b-[3px] border-b-transparent"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "resumen" && <OverviewTab />}
        {activeTab === "ingresos" && <IncomeTab />}
        {activeTab === "gastos" && <ExpensesTab />}
        {activeTab === "presupuesto" && <BudgetTab />}
        {activeTab === "facturas" && <BillsTab />}
        {activeTab === "suscripciones" && <SubscriptionsTab />}
        {activeTab === "deseos" && <WishlistTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
};

export default BudgetTrackerPage;
