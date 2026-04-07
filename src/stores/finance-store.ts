import { create } from "zustand";
import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  subcategory?: string | null;
  paymentMethod?: string | null;
  isRecurring: boolean;
}

interface BudgetCategory {
  id: string;
  category: string;
  month: string;
  limit: number;
  spent: number;
}

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  isRecurring: boolean;
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: "monthly" | "annual";
  renewalDate: string;
  category: string;
  isActive: boolean;
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  priority: "need" | "want";
  savedAmount: number;
  link?: string | null;
  isPurchased: boolean;
}

interface FinanceState {
  transactions: Transaction[];
  budgets: BudgetCategory[];
  bills: Bill[];
  subscriptions: Subscription[];
  wishlist: WishlistItem[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Lifecycle
  initialize: () => Promise<void>;

  // Transactions
  addTransaction: (t: Omit<Transaction, "id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budget
  upsertBudget: (category: string, limit: number, month?: string) => Promise<void>;

  // Bills
  toggleBillPaid: (id: string) => Promise<void>;
  addBill: (b: Omit<Bill, "id">) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;

  // Subscriptions
  toggleSubscription: (id: string) => Promise<void>;
  addSubscription: (s: Omit<Subscription, "id">) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;

  // Wishlist
  addWishlistItem: (item: Omit<WishlistItem, "id" | "isPurchased">) => Promise<void>;
  updateWishlistItem: (id: string, data: Partial<WishlistItem>) => Promise<void>;
  deleteWishlistItem: (id: string) => Promise<void>;

  // Computed
  totalIncome: () => number;
  totalExpenses: () => number;
  monthlySubscriptionCost: () => number;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  budgets: [],
  bills: [],
  subscriptions: [],
  wishlist: [],
  isLoaded: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (get().isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [transactions, budgets, bills, subscriptions, wishlist] =
        await Promise.all([
          api.get<Transaction[]>("/finance/transactions"),
          api.get<BudgetCategory[]>(`/finance/budgets?month=${currentMonth}`),
          api.get<Bill[]>("/finance/bills"),
          api.get<Subscription[]>("/finance/subscriptions"),
          api.get<WishlistItem[]>("/finance/wishlist"),
        ]);
      set({ transactions, budgets, bills, subscriptions, wishlist, isLoaded: true, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar finanzas";
      set({ error: msg, isLoading: false });
    }
  },

  addTransaction: async (t) => {
    const created = await api.post<Transaction>("/finance/transactions", t);
    set((state) => ({ transactions: [created, ...state.transactions] }));
    // Refresh budgets to reflect new spent amounts
    const currentMonth = new Date().toISOString().slice(0, 7);
    const budgets = await api.get<BudgetCategory[]>(`/finance/budgets?month=${currentMonth}`);
    set({ budgets });
  },

  deleteTransaction: async (id) => {
    set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
    await api.delete(`/finance/transactions/${id}`);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const budgets = await api.get<BudgetCategory[]>(`/finance/budgets?month=${currentMonth}`);
    set({ budgets });
  },

  upsertBudget: async (category, limit, month) => {
    const targetMonth = month ?? new Date().toISOString().slice(0, 7);
    const budget = await api.post<BudgetCategory>("/finance/budgets", { category, limit, month: targetMonth });
    set((state) => ({
      budgets: state.budgets.some((b) => b.category === category && b.month === targetMonth)
        ? state.budgets.map((b) =>
            b.category === category && b.month === targetMonth ? { ...b, limit } : b
          )
        : [...state.budgets, budget],
    }));
  },

  toggleBillPaid: async (id) => {
    const bill = get().bills.find((b) => b.id === id);
    if (!bill) return;
    set((state) => ({
      bills: state.bills.map((b) => (b.id === id ? { ...b, isPaid: !b.isPaid } : b)),
    }));
    await api.patch(`/finance/bills/${id}`, { isPaid: !bill.isPaid });
  },

  addBill: async (b) => {
    const created = await api.post<Bill>("/finance/bills", b);
    set((state) => ({ bills: [...state.bills, created] }));
  },

  deleteBill: async (id) => {
    set((state) => ({ bills: state.bills.filter((b) => b.id !== id) }));
    await api.delete(`/finance/bills/${id}`);
  },

  toggleSubscription: async (id) => {
    const sub = get().subscriptions.find((s) => s.id === id);
    if (!sub) return;
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, isActive: !s.isActive } : s
      ),
    }));
    await api.patch(`/finance/subscriptions/${id}`, { isActive: !sub.isActive });
  },

  addSubscription: async (s) => {
    const created = await api.post<Subscription>("/finance/subscriptions", s);
    set((state) => ({ subscriptions: [...state.subscriptions, created] }));
  },

  deleteSubscription: async (id) => {
    set((state) => ({ subscriptions: state.subscriptions.filter((s) => s.id !== id) }));
    await api.delete(`/finance/subscriptions/${id}`);
  },

  addWishlistItem: async (item) => {
    const created = await api.post<WishlistItem>("/finance/wishlist", item);
    set((state) => ({ wishlist: [created, ...state.wishlist] }));
  },

  updateWishlistItem: async (id, data) => {
    set((state) => ({
      wishlist: state.wishlist.map((w) => (w.id === id ? { ...w, ...data } : w)),
    }));
    await api.patch(`/finance/wishlist/${id}`, data);
  },

  deleteWishlistItem: async (id) => {
    set((state) => ({ wishlist: state.wishlist.filter((w) => w.id !== id) }));
    await api.delete(`/finance/wishlist/${id}`);
  },

  totalIncome: () =>
    get().transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),

  totalExpenses: () =>
    get().transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0),

  monthlySubscriptionCost: () =>
    get().subscriptions
      .filter((s) => s.isActive)
      .reduce(
        (sum, s) => sum + (s.billingCycle === "monthly" ? s.amount : s.amount / 12),
        0
      ),
}));
