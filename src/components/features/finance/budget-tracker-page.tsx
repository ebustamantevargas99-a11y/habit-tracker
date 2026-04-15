"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { colors } from "@/lib/colors";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import {
  DollarSign, TrendingUp, PiggyBank, CreditCard, Receipt,
  Plus, Trash2, Check, Clock, AlertTriangle, Star, ShoppingBag,
  Repeat, Calendar, ArrowUpRight, ArrowDownRight, Target, BarChart2,
} from "lucide-react";

const C = colors;

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
// SHARED STYLES
// ============================================================================

const cardStyle: React.CSSProperties = {
  background: C.warmWhite,
  border: `1px solid ${C.lightCream}`,
  borderRadius: "12px",
  padding: "20px",
};

const tableHeaderStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "left" as const,
  fontSize: "12px",
  fontWeight: "600",
  color: C.dark,
  borderBottom: `2px solid ${C.tan}`,
  textTransform: "uppercase" as const,
};

const tableCellStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: "13px",
  borderBottom: `1px solid ${C.lightCream}`,
};

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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { label: "Ingresos", value: `$${totalIncome.toLocaleString()}`, icon: ArrowUpRight, color: C.success, bg: C.successLight },
          { label: "Gastos", value: `$${totalExpenses.toLocaleString()}`, icon: ArrowDownRight, color: C.danger, bg: C.dangerLight },
          { label: "Ahorro Neto", value: `$${netSavings.toLocaleString()}`, icon: PiggyBank, color: C.accent, bg: C.accentGlow },
          { label: "Tasa de Ahorro", value: `${savingsRate}%`, icon: Target, color: C.info, bg: C.infoLight },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} style={{ ...cardStyle, background: card.bg, border: `2px solid ${card.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Icon size={18} color={card.color} />
                <span style={{ fontSize: "12px", fontWeight: "600", color: C.dark }}>{card.label}</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "Georgia, serif", color: card.color }}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Monthly Trend */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: C.dark, marginBottom: "16px" }}>
            Tendencia Mensual (6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: C.warmWhite, border: `1px solid ${C.tan}`, borderRadius: "8px" }} />
              <Bar dataKey="income" fill={C.success} name="Ingresos" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill={C.danger} name="Gastos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Savings Trend */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: C.dark, marginBottom: "16px" }}>
            Evolución del Ahorro
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MONTHLY_TREND.map((m) => ({ ...m, savings: m.income - m.expenses }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: C.warmWhite, border: `1px solid ${C.tan}`, borderRadius: "8px" }} />
              <Line type="monotone" dataKey="savings" stroke={C.accent} strokeWidth={3} dot={{ fill: C.accent, r: 5 }} name="Ahorro" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: C.dark, marginBottom: "16px" }}>
          Desglose de Gastos por Categoría
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {catBreakdown.map((cat) => {
            const pct = Math.round((cat.value / totalExpenses) * 100);
            return (
              <div key={cat.name} style={{ background: C.lightCream, borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>{cat.emoji}</div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: C.dark }}>{cat.name}</div>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: C.brown, fontFamily: "Georgia, serif" }}>
                  ${cat.value}
                </div>
                <div style={{ fontSize: "11px", color: C.warm }}>{pct}% del total</div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ ...cardStyle, background: C.successLight, border: `2px solid ${C.success}`, padding: "16px 24px" }}>
          <span style={{ fontSize: "12px", color: C.dark, fontWeight: "600" }}>Total Ingresos</span>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: C.success, fontFamily: "Georgia, serif" }}>
            ${total.toLocaleString()}
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", background: C.accent, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} /> Agregar Ingreso
        </button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Descripción</label>
            <input value={newIncome.description} onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Monto ($)</label>
            <input type="number" value={newIncome.amount} onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Categoría</label>
            <select value={newIncome.category} onChange={(e) => setNewIncome({ ...newIncome, category: e.target.value })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Fecha</label>
            <input type="date" value={newIncome.date} onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <button onClick={addIncome} style={{ padding: "8px 16px", background: C.success, color: C.paper, border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
            <Check size={16} />
          </button>
        </div>
      )}

      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Fecha</th>
              <th style={tableHeaderStyle}>Descripción</th>
              <th style={tableHeaderStyle}>Categoría</th>
              <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Monto</th>
              <th style={{ ...tableHeaderStyle, textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {incomes.map((tx) => (
              <tr key={tx.id}>
                <td style={{ ...tableCellStyle, color: C.warm }}>{tx.date}</td>
                <td style={{ ...tableCellStyle, fontWeight: "500", color: C.dark }}>{tx.description}</td>
                <td style={tableCellStyle}>
                  <span style={{ background: C.successLight, color: C.success, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                    {tx.category}
                  </span>
                </td>
                <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: "600", color: C.success }}>
                  +${tx.amount.toLocaleString()}
                </td>
                <td style={{ ...tableCellStyle, textAlign: "center" }}>
                  <button onClick={() => setIncomes(incomes.filter((i) => i.id !== tx.id))} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, opacity: 0.6 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ ...cardStyle, background: C.dangerLight, border: `2px solid ${C.danger}`, padding: "16px 24px" }}>
            <span style={{ fontSize: "12px", color: C.dark, fontWeight: "600" }}>Total Gastos</span>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: C.danger, fontFamily: "Georgia, serif" }}>
              ${total.toLocaleString()}
            </div>
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: "10px 16px", border: `1px solid ${C.tan}`, borderRadius: "8px", fontSize: "13px", background: C.paper }}>
            <option value="Todos">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", background: C.accent, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} /> Agregar Gasto
        </button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Descripción</label>
            <input value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Monto ($)</label>
            <input type="number" value={newExp.amount} onChange={(e) => setNewExp({ ...newExp, amount: e.target.value })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Categoría</label>
            <select value={newExp.category} onChange={(e) => setNewExp({ ...newExp, category: e.target.value })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Fecha</label>
            <input type="date" value={newExp.date} onChange={(e) => setNewExp({ ...newExp, date: e.target.value })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <button onClick={addExpense} style={{ padding: "8px 16px", background: C.danger, color: C.paper, border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
            <Check size={16} />
          </button>
        </div>
      )}

      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Fecha</th>
              <th style={tableHeaderStyle}>Descripción</th>
              <th style={tableHeaderStyle}>Categoría</th>
              <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Monto</th>
              <th style={{ ...tableHeaderStyle, textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td style={{ ...tableCellStyle, color: C.warm }}>{tx.date}</td>
                <td style={{ ...tableCellStyle, fontWeight: "500", color: C.dark }}>{tx.description}</td>
                <td style={tableCellStyle}>
                  <span style={{ background: C.warningLight, color: C.warning, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                    {tx.category}
                  </span>
                </td>
                <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: "600", color: C.danger }}>
                  -${tx.amount.toLocaleString()}
                </td>
                <td style={{ ...tableCellStyle, textAlign: "center" }}>
                  <button onClick={() => setExpenses(expenses.filter((e) => e.id !== tx.id))} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, opacity: 0.6 }}>
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

  const getColor = (spent: number, budget: number) => {
    const pct = (spent / budget) * 100;
    if (pct > 90) return C.danger;
    if (pct > 75) return C.warning;
    return C.success;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Adherence Gauge */}
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <div style={{ ...cardStyle, textAlign: "center", minWidth: "180px" }}>
          <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 12px" }}>
            <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke={C.lightCream} strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={C.accent} strokeWidth="8" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - Math.min(adherence, 100) / 100)} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.dark }}>{adherence}%</div>
            </div>
          </div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: C.dark }}>Adherencia</div>
          <div style={{ fontSize: "11px", color: C.warm }}>al presupuesto</div>
        </div>

        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: C.warm, marginBottom: "4px" }}>Presupuesto Total</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.dark }}>
                ${totalBudget.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: C.warm, marginBottom: "4px" }}>Gastado</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.danger }}>
                ${totalSpent.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: C.warm, marginBottom: "4px" }}>Restante</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.success }}>
                ${(totalBudget - totalSpent).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Bars */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: C.dark, marginBottom: "20px" }}>Progreso por Categoría</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {budgets.map((b) => {
            const pct = Math.round((b.spent / b.budget) * 100);
            const color = getColor(b.spent, b.budget);
            return (
              <div key={b.category}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>{b.emoji}</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: C.dark }}>{b.category}</span>
                  </div>
                  <span style={{ fontSize: "12px", color: C.warm }}>
                    ${b.spent} / ${b.budget} ({pct}%)
                  </span>
                </div>
                <div style={{ width: "100%", height: "10px", background: C.lightCream, borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: "5px", transition: "width 0.5s ease" }} />
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

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case "pagado": return { background: C.successLight, color: C.success };
      case "pendiente": return { background: C.warningLight, color: C.warning };
      case "vencido": return { background: C.dangerLight, color: C.danger };
      default: return {};
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: C.warm, marginBottom: "4px" }}>Total Mensual</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.dark }}>${totalMonthly.toLocaleString()}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: "center", background: C.successLight }}>
          <div style={{ fontSize: "11px", color: C.success, marginBottom: "4px" }}>Pagado</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.success }}>${paid.toLocaleString()}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: "center", background: C.warningLight }}>
          <div style={{ fontSize: "11px", color: C.warning, marginBottom: "4px" }}>Pendiente</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.warning }}>${pending.toLocaleString()}</div>
        </div>
      </div>

      {/* Bill Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {bills.map((bill) => {
          const statusStyle = getStatusStyle(bill.status);
          return (
            <div key={bill.id} style={{ ...cardStyle, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: C.dark }}>{bill.name}</div>
                  <div style={{ fontSize: "11px", color: C.warm }}>{bill.category}</div>
                </div>
                <span style={{ ...statusStyle, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                  {getStatusIcon(bill.status)} {bill.status}
                </span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.brown, marginBottom: "8px" }}>
                ${bill.amount}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.warm }}>
                <Calendar size={12} />
                Vence: {bill.dueDate}
              </div>
              {bill.status === "pendiente" && (
                <button onClick={() => setBills(bills.map((b) => b.id === bill.id ? { ...b, status: "pagado" as const } : b))} style={{ marginTop: "12px", width: "100%", padding: "8px", background: C.success, color: C.paper, border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <Repeat size={20} color={C.accent} style={{ margin: "0 auto 8px", display: "block" }} />
          <div style={{ fontSize: "11px", color: C.warm, marginBottom: "4px" }}>Suscripciones Activas</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.dark }}>{activeSubs.length}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: "center", background: C.accentGlow }}>
          <div style={{ fontSize: "11px", color: C.brown, marginBottom: "4px" }}>Costo Mensual</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.accent }}>
            ${totalMonthly.toFixed(2)}
          </div>
        </div>
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: C.warm, marginBottom: "4px" }}>Costo Anual</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.danger }}>
            ${totalAnnual.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Subscription Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {subs.map((sub) => (
          <div key={sub.id} style={{ ...cardStyle, opacity: sub.active ? 1 : 0.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: C.dark }}>{sub.name}</div>
                <span style={{ fontSize: "11px", color: C.warm, background: C.lightCream, padding: "2px 8px", borderRadius: "8px" }}>
                  {sub.category}
                </span>
              </div>
              <div style={{ fontSize: "22px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.accent }}>
                ${sub.costMonth}
              </div>
            </div>
            <div style={{ fontSize: "11px", color: C.warm, marginBottom: "12px" }}>
              /mes · Renueva: {sub.renewalDate}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setSubs(subs.map((s) => s.id === sub.id ? { ...s, active: !s.active } : s))} style={{ flex: 1, padding: "8px", background: sub.active ? C.dangerLight : C.successLight, color: sub.active ? C.danger : C.success, border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "11px" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", background: C.accent, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} /> Agregar Deseo
        </button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Nombre</label>
            <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Precio ($)</label>
            <input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Prioridad</label>
            <select value={newItem.priority} onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as "Necesito" | "Quiero" })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }}>
              <option value="Necesito">Necesito</option>
              <option value="Quiero">Quiero</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", color: C.warm, display: "block", marginBottom: "4px" }}>Ahorrado ($)</label>
            <input type="number" value={newItem.saved} onChange={(e) => setNewItem({ ...newItem, saved: e.target.value })} style={{ width: "100%", padding: "8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <button onClick={addItem} style={{ padding: "8px 16px", background: C.accent, color: C.paper, border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
            <Check size={16} />
          </button>
        </div>
      )}

      {/* Wishlist Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {items.map((item) => {
          const pct = Math.round((item.saved / item.price) * 100);
          return (
            <div key={item.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: C.dark }}>{item.name}</div>
                  <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 10px", borderRadius: "12px", background: item.priority === "Necesito" ? C.dangerLight : C.infoLight, color: item.priority === "Necesito" ? C.danger : C.info }}>
                    {item.priority}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "22px", fontWeight: "bold", fontFamily: "Georgia, serif", color: C.accent }}>
                    ${item.price.toLocaleString()}
                  </div>
                  <button onClick={() => setItems(items.filter((i) => i.id !== item.id))} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, opacity: 0.5 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: C.warm }}>Ahorrado: ${item.saved.toLocaleString()}</span>
                <span style={{ fontWeight: "600", color: C.accent }}>{pct}%</span>
              </div>
              <div style={{ width: "100%", height: "10px", background: C.lightCream, borderRadius: "5px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`, borderRadius: "5px", transition: "width 0.5s ease" }} />
              </div>
              <div style={{ fontSize: "11px", color: C.warm, marginTop: "6px" }}>
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

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.paper, borderRadius: '12px', padding: '20px',
    border: `1px solid ${C.lightCream}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
        {[
          { label: 'Ingresos', value: `$${totalIncome.toLocaleString()}`, color: C.success, emoji: '📈' },
          { label: 'Gastos', value: `$${totalExpense.toLocaleString()}`, color: C.danger, emoji: '📉' },
          { label: 'Ahorro', value: `$${(totalIncome - totalExpense).toLocaleString()}`, color: C.info, emoji: '💰' },
          { label: 'Tasa de Ahorro', value: `${savingsRate}%`, color: C.accent, emoji: '🎯' },
        ].map((s, i) => (
          <div key={i} style={{ ...cardStyle, textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>{s.emoji}</span>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: s.color, margin: '8px 0 4px 0' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: C.warm }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Expense by Category - Pie */}
        <div style={cardStyle}>
          <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0', fontSize: '1rem' }}>
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
        <div style={cardStyle}>
          <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0', fontSize: '1rem' }}>
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
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0', fontSize: '1rem' }}>
          📈 Tendencia Mensual (6 meses)
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
            <XAxis dataKey="mes" tick={{ fill: C.warm, fontSize: 12 }} />
            <YAxis tick={{ fill: C.warm, fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: `1px solid ${C.tan}` }} />
            <Legend />
            <Bar dataKey="ingresos" name="Ingresos" fill={C.success} radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" name="Gastos" fill={C.danger} radius={[4, 4, 0, 0]} />
            <Bar dataKey="ahorro" name="Ahorro" fill={C.info} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown Table */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0', fontSize: '1rem' }}>
          📋 Desglose de Gastos
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: C.cream }}>
              {['Categoría', 'Monto', '% del Total', 'Progreso'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.8rem', color: C.warm, fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenseByCategory.sort((a, b) => b.value - a.value).map((cat, i) => {
              const pct = Math.round((cat.value / totalExpense) * 100);
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.lightCream}` }}>
                  <td style={{ padding: '10px 14px', fontSize: '0.9rem', color: C.dark, fontWeight: '500' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cat.color, marginRight: '8px' }} />
                    {cat.name}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '0.9rem', color: C.dark, fontWeight: '600' }}>${cat.value.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: C.warm }}>{pct}%</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ width: '100%', height: '8px', backgroundColor: C.lightCream, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: cat.color, borderRadius: '4px' }} />
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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "8px", borderBottom: `2px solid ${C.lightCream}`, paddingBottom: "0", overflowX: "auto" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 16px",
                background: isActive ? C.accent : "transparent",
                color: isActive ? C.paper : C.warm,
                border: "none",
                borderBottom: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: isActive ? "700" : "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                borderRadius: "8px 8px 0 0",
              }}
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
