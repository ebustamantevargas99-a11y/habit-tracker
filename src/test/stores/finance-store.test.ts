import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api-client so no real network calls are made
vi.mock('@/lib/api-client', () => ({
  api: {
    get:    vi.fn(),
    post:   vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}));

import { useFinanceStore } from '@/stores/finance-store';
import { api } from '@/lib/api-client';

const mockGet    = api.get    as ReturnType<typeof vi.fn>;
const mockPost   = api.post   as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

const SAMPLE_TRANSACTIONS = [
  { id: 't1', date: '2026-04-01', description: 'Salary', amount: 5000, category: 'Salario', type: 'income' as const, isRecurring: true },
  { id: 't2', date: '2026-04-05', description: 'Rent',   amount: 1200, category: 'Vivienda', type: 'expense' as const, isRecurring: true },
  { id: 't3', date: '2026-04-10', description: 'Food',   amount: 300,  category: 'Comida', type: 'expense' as const, isRecurring: false },
];

beforeEach(() => {
  vi.clearAllMocks();
  useFinanceStore.setState({
    transactions: [],
    budgets: [],
    bills: [],
    subscriptions: [],
    wishlist: [],
    isLoaded: false,
    isLoading: false,
    error: null,
  });
});

describe('useFinanceStore — initialize()', () => {
  it('loads transactions, budgets, bills, subscriptions, wishlist', async () => {
    mockGet.mockResolvedValue([]);
    await useFinanceStore.getState().initialize();
    expect(useFinanceStore.getState().isLoaded).toBe(true);
  });

  it('does not re-fetch when already loaded', async () => {
    useFinanceStore.setState({ isLoaded: true });
    await useFinanceStore.getState().initialize();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('sets error on failure', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    await useFinanceStore.getState().initialize();
    expect(useFinanceStore.getState().error).toBe('Network error');
  });
});

describe('useFinanceStore — addTransaction()', () => {
  it('adds transaction to state after API success', async () => {
    const newTx = { id: 't99', date: '2026-04-17', description: 'Bonus', amount: 1000, category: 'Salario', type: 'income' as const, isRecurring: false };
    mockPost.mockResolvedValue(newTx);
    mockGet.mockResolvedValue([]); // budget refresh

    await useFinanceStore.getState().addTransaction({ date: newTx.date, description: newTx.description, amount: newTx.amount, category: newTx.category, type: newTx.type, isRecurring: false });
    expect(useFinanceStore.getState().transactions).toContainEqual(newTx);
  });
});

describe('useFinanceStore — computed: totalIncome()', () => {
  it('sums income transactions', () => {
    useFinanceStore.setState({ transactions: SAMPLE_TRANSACTIONS });
    expect(useFinanceStore.getState().totalIncome()).toBe(5000);
  });

  it('returns 0 when no income transactions', () => {
    useFinanceStore.setState({ transactions: SAMPLE_TRANSACTIONS.filter(t => t.type === 'expense') });
    expect(useFinanceStore.getState().totalIncome()).toBe(0);
  });
});

describe('useFinanceStore — computed: totalExpenses()', () => {
  it('sums expense transactions', () => {
    useFinanceStore.setState({ transactions: SAMPLE_TRANSACTIONS });
    expect(useFinanceStore.getState().totalExpenses()).toBe(1500);
  });

  it('returns 0 when no expense transactions', () => {
    useFinanceStore.setState({ transactions: SAMPLE_TRANSACTIONS.filter(t => t.type === 'income') });
    expect(useFinanceStore.getState().totalExpenses()).toBe(0);
  });
});

describe('useFinanceStore — computed: monthlySubscriptionCost()', () => {
  it('sums active monthly subscriptions', () => {
    useFinanceStore.setState({
      subscriptions: [
        { id: 's1', name: 'Netflix', amount: 15, billingCycle: 'monthly', renewalDate: '2026-05-01', category: 'Entertainment', isActive: true },
        { id: 's2', name: 'Spotify', amount: 10, billingCycle: 'monthly', renewalDate: '2026-05-01', category: 'Entertainment', isActive: true },
        { id: 's3', name: 'Annual', amount: 120, billingCycle: 'annual', renewalDate: '2026-12-01', category: 'Software', isActive: true },
      ],
    });
    // 15 + 10 + 120/12 = 35
    expect(useFinanceStore.getState().monthlySubscriptionCost()).toBeCloseTo(35, 1);
  });

  it('excludes inactive subscriptions', () => {
    useFinanceStore.setState({
      subscriptions: [
        { id: 's1', name: 'Netflix', amount: 15, billingCycle: 'monthly', renewalDate: '2026-05-01', category: 'Entertainment', isActive: false },
      ],
    });
    expect(useFinanceStore.getState().monthlySubscriptionCost()).toBe(0);
  });
});

describe('useFinanceStore — deleteTransaction()', () => {
  it('removes transaction from state optimistically', async () => {
    useFinanceStore.setState({ transactions: SAMPLE_TRANSACTIONS });
    mockDelete.mockResolvedValue(undefined);
    mockGet.mockResolvedValue([]); // budget refresh

    await useFinanceStore.getState().deleteTransaction('t1');
    expect(useFinanceStore.getState().transactions.find(t => t.id === 't1')).toBeUndefined();
  });
});
