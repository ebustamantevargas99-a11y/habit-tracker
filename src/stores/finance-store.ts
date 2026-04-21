"use client";

import { create } from "zustand";
import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AccountType =
  | "checking"
  | "savings"
  | "credit"
  | "investment"
  | "loan"
  | "crypto"
  | "cash";

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  creditLimit: number | null;
  interestRate: number | null;
  institution: string | null;
  color: string | null;
  icon: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  subcategory: string | null;
  merchant: string | null;
  description: string | null;
  notes: string | null;
  tags: string[];
  photoData: string | null;
  recurringId: string | null;
  transferToAccountId: string | null;
  createdAt: string;
  account?: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    currency: string;
  };
}

export type Frequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "annual";

export interface RecurringTransaction {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  subcategory: string | null;
  merchant: string | null;
  frequency: Frequency;
  dayOfMonth: number | null;
  nextDate: string;
  endDate: string | null;
  active: boolean;
  autoLog: boolean;
  linkedEventId: string | null;
  lastLoggedDate: string | null;
  account?: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    currency: string;
  };
}

export interface SavingsGoal {
  id: string;
  name: string;
  emoji: string | null;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  priority: "low" | "medium" | "high" | null;
  linkedAccountId: string | null;
  category: string | null;
  notes: string | null;
  achieved: boolean;
  achievedAt: string | null;
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  type: string;
  balance: number;
  originalAmount: number | null;
  interestRate: number;
  minPayment: number;
  dueDay: number | null;
  linkedAccountId: string | null;
  active: boolean;
  paidOffAt: string | null;
  createdAt: string;
}

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  averageCost: number;
  currency: string;
  linkedAccountId: string | null;
  lastPrice: number | null;
  lastPriceAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface BudgetWithSpent {
  id: string;
  month: string;
  category: string;
  limit: number;
  spent: number;
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface FinanceState {
  accounts: FinancialAccount[];
  transactions: Transaction[];
  recurring: RecurringTransaction[];
  goals: SavingsGoal[];
  debts: Debt[];
  investments: Investment[];
  budgets: BudgetWithSpent[];

  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;

  // Accounts
  createAccount: (data: Partial<FinancialAccount> & { name: string; type: AccountType }) => Promise<FinancialAccount | null>;
  updateAccount: (id: string, patch: Partial<FinancialAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Transactions
  createTransaction: (data: Partial<Transaction> & { accountId: string; amount: number; type: TransactionType; category: string }) => Promise<Transaction | null>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Recurring
  createRecurring: (data: Partial<RecurringTransaction> & { accountId: string; name: string; amount: number; type: "income" | "expense"; category: string; frequency: Frequency; nextDate: string }) => Promise<RecurringTransaction | null>;
  updateRecurring: (id: string, patch: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  logRecurringNow: (id: string) => Promise<void>;

  // Goals
  createGoal: (data: Partial<SavingsGoal> & { name: string; targetAmount: number }) => Promise<SavingsGoal | null>;
  updateGoal: (id: string, patch: Partial<SavingsGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  depositToGoal: (id: string, amount: number, fromAccountId?: string | null) => Promise<void>;

  // Debts
  createDebt: (data: Partial<Debt> & { name: string; type: string; balance: number; interestRate: number; minPayment: number }) => Promise<Debt | null>;
  updateDebt: (id: string, patch: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  payDebt: (id: string, amount: number, fromAccountId?: string | null) => Promise<void>;

  // Investments
  createInvestment: (data: Partial<Investment> & { symbol: string; name: string; type: string; quantity: number; averageCost: number }) => Promise<Investment | null>;
  updateInvestment: (id: string, patch: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;

  // Budgets
  upsertBudget: (category: string, month: string, limit: number) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [],
  transactions: [],
  recurring: [],
  goals: [],
  debts: [],
  investments: [],
  budgets: [],
  isLoaded: false,
  isLoading: false,
  error: null,
  clearError: () => set({ error: null }),

  initialize: async () => {
    if (get().isLoaded || get().isLoading) return;
    await get().refresh();
  },

  refresh: async () => {
    set({ isLoading: true, error: null });
    try {
      const month = new Date().toISOString().slice(0, 7);
      const [accounts, transactions, recurring, goals, debts, investments, budgets] =
        await Promise.all([
          api.get<FinancialAccount[]>("/finance/accounts"),
          api.get<Transaction[]>("/finance/transactions?limit=200"),
          api.get<RecurringTransaction[]>("/finance/recurring"),
          api.get<SavingsGoal[]>("/finance/goals"),
          api.get<Debt[]>("/finance/debts"),
          api.get<Investment[]>("/finance/investments"),
          api.get<BudgetWithSpent[]>(`/finance/budgets?month=${month}`),
        ]);
      set({
        accounts, transactions, recurring, goals, debts, investments, budgets,
        isLoaded: true, isLoading: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error cargando finanzas";
      set({ error: msg, isLoading: false });
    }
  },

  // Accounts
  createAccount: async (data) => {
    try {
      const acc = await api.post<FinancialAccount>("/finance/accounts", data);
      set((s) => ({ accounts: [...s.accounts, acc] }));
      return acc;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error" });
      return null;
    }
  },
  updateAccount: async (id, patch) => {
    const acc = await api.patch<FinancialAccount>(`/finance/accounts/${id}`, patch);
    set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? acc : a)) }));
  },
  deleteAccount: async (id) => {
    await api.delete(`/finance/accounts/${id}`);
    await get().refresh();
  },

  // Transactions
  createTransaction: async (data) => {
    try {
      const txn = await api.post<Transaction>("/finance/transactions", data);
      await get().refresh();
      return txn;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error" });
      return null;
    }
  },
  updateTransaction: async (id, patch) => {
    await api.patch(`/finance/transactions/${id}`, patch);
    await get().refresh();
  },
  deleteTransaction: async (id) => {
    await api.delete(`/finance/transactions/${id}`);
    await get().refresh();
  },

  // Recurring
  createRecurring: async (data) => {
    try {
      const r = await api.post<RecurringTransaction>("/finance/recurring", data);
      set((s) => ({ recurring: [...s.recurring, r] }));
      return r;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error" });
      return null;
    }
  },
  updateRecurring: async (id, patch) => {
    const r = await api.patch<RecurringTransaction>(`/finance/recurring/${id}`, patch);
    set((s) => ({ recurring: s.recurring.map((x) => (x.id === id ? r : x)) }));
  },
  deleteRecurring: async (id) => {
    await api.delete(`/finance/recurring/${id}`);
    set((s) => ({ recurring: s.recurring.filter((r) => r.id !== id) }));
  },
  logRecurringNow: async (id) => {
    await api.post(`/finance/recurring/${id}`, {});
    await get().refresh();
  },

  // Goals
  createGoal: async (data) => {
    try {
      const g = await api.post<SavingsGoal>("/finance/goals", data);
      set((s) => ({ goals: [...s.goals, g] }));
      return g;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error" });
      return null;
    }
  },
  updateGoal: async (id, patch) => {
    const g = await api.patch<SavingsGoal>(`/finance/goals/${id}`, patch);
    set((s) => ({ goals: s.goals.map((x) => (x.id === id ? g : x)) }));
  },
  deleteGoal: async (id) => {
    await api.delete(`/finance/goals/${id}`);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },
  depositToGoal: async (id, amount, fromAccountId) => {
    await api.post(`/finance/goals/${id}/deposit`, { amount, fromAccountId });
    await get().refresh();
  },

  // Debts
  createDebt: async (data) => {
    try {
      const d = await api.post<Debt>("/finance/debts", data);
      set((s) => ({ debts: [...s.debts, d] }));
      return d;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error" });
      return null;
    }
  },
  updateDebt: async (id, patch) => {
    const d = await api.patch<Debt>(`/finance/debts/${id}`, patch);
    set((s) => ({ debts: s.debts.map((x) => (x.id === id ? d : x)) }));
  },
  deleteDebt: async (id) => {
    await api.delete(`/finance/debts/${id}`);
    set((s) => ({ debts: s.debts.filter((d) => d.id !== id) }));
  },
  payDebt: async (id, amount, fromAccountId) => {
    await api.post(`/finance/debts/${id}/payment`, { amount, fromAccountId });
    await get().refresh();
  },

  // Investments
  createInvestment: async (data) => {
    try {
      const inv = await api.post<Investment>("/finance/investments", data);
      set((s) => ({ investments: [...s.investments, inv] }));
      return inv;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error" });
      return null;
    }
  },
  updateInvestment: async (id, patch) => {
    const inv = await api.patch<Investment>(`/finance/investments/${id}`, patch);
    set((s) => ({ investments: s.investments.map((x) => (x.id === id ? inv : x)) }));
  },
  deleteInvestment: async (id) => {
    await api.delete(`/finance/investments/${id}`);
    set((s) => ({ investments: s.investments.filter((i) => i.id !== id) }));
  },

  // Budgets
  upsertBudget: async (category, month, limit) => {
    await api.post<BudgetWithSpent>("/finance/budgets", { category, month, limit });
    await get().refresh();
  },
  deleteBudget: async (id) => {
    await api.delete(`/finance/budgets/${id}`);
    set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
  },
}));
