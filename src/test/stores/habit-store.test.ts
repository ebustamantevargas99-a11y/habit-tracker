import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  api: {
    get:    vi.fn(),
    post:   vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}));

import { useHabitStore } from '@/stores/habit-store';
import { api } from '@/lib/api-client';
import type { Habit, HabitLog } from '@/types';

const mockGet    = api.get    as ReturnType<typeof vi.fn>;
const mockPost   = api.post   as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

const TODAY = new Date().toISOString().split('T')[0];

const SAMPLE_HABITS: Habit[] = [
  { id: 'h1', name: 'Run', icon: '🏃', category: 'fitness', timeOfDay: 'all', frequency: 'daily', targetDays: [0,1,2,3,4,5,6], streakCurrent: 5, streakBest: 10, strength: 50, isActive: true, createdAt: '2026-01-01' },
  { id: 'h2', name: 'Read', icon: '📚', category: 'learning', timeOfDay: 'all', frequency: 'daily', targetDays: [0,1,2,3,4,5,6], streakCurrent: 2, streakBest: 7, strength: 30, isActive: true, createdAt: '2026-01-01' },
];

const SAMPLE_LOGS: HabitLog[] = [
  { id: 'l1', habitId: 'h1', date: TODAY, completed: true },
  { id: 'l2', habitId: 'h2', date: TODAY, completed: false },
];

beforeEach(() => {
  vi.clearAllMocks();
  useHabitStore.setState({
    habits: [],
    logs: [],
    isLoaded: false,
    isLoading: false,
    error: null,
  });
});

describe('useHabitStore — initialize()', () => {
  it('loads habits and logs from API', async () => {
    mockGet.mockResolvedValueOnce(SAMPLE_HABITS).mockResolvedValueOnce(SAMPLE_LOGS);
    await useHabitStore.getState().initialize();
    expect(useHabitStore.getState().habits).toEqual(SAMPLE_HABITS);
    expect(useHabitStore.getState().logs).toEqual(SAMPLE_LOGS);
    expect(useHabitStore.getState().isLoaded).toBe(true);
  });

  it('does not re-fetch when already loaded', async () => {
    useHabitStore.setState({ isLoaded: true });
    await useHabitStore.getState().initialize();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('sets error on API failure', async () => {
    mockGet.mockRejectedValue(new Error('fetch failed'));
    await useHabitStore.getState().initialize();
    expect(useHabitStore.getState().error).toBe('fetch failed');
  });
});

describe('useHabitStore — toggleHabitToday() optimistic update', () => {
  it('optimistically adds a completed log before API resolves', async () => {
    useHabitStore.setState({ habits: SAMPLE_HABITS, logs: [], isLoaded: true });

    // Delay resolution to observe optimistic update
    let resolvePost!: (v: unknown) => void;
    mockPost.mockReturnValue(new Promise((res) => { resolvePost = res; }));

    const promise = useHabitStore.getState().toggleHabitToday('h1');

    // Optimistic: log should appear immediately
    const optimisticLog = useHabitStore.getState().logs.find((l) => l.habitId === 'h1' && l.date === TODAY);
    expect(optimisticLog?.completed).toBe(true);

    // Resolve the API
    resolvePost({ log: { id: 'server-l1', habitId: 'h1', date: TODAY, completed: true }, habit: SAMPLE_HABITS[0] });
    await promise;
  });

  it('rolls back optimistic update on API failure', async () => {
    useHabitStore.setState({ habits: SAMPLE_HABITS, logs: [], isLoaded: true });
    mockPost.mockRejectedValue(new Error('network'));
    await useHabitStore.getState().toggleHabitToday('h1');
    // Log should be removed after rollback
    expect(useHabitStore.getState().logs.find((l) => l.habitId === 'h1' && l.date === TODAY)).toBeUndefined();
  });

  it('toggles existing completed log to false', async () => {
    useHabitStore.setState({ habits: SAMPLE_HABITS, logs: [SAMPLE_LOGS[0]], isLoaded: true });
    let resolvePost!: (v: unknown) => void;
    mockPost.mockReturnValue(new Promise((res) => { resolvePost = res; }));
    const promise = useHabitStore.getState().toggleHabitToday('h1');
    const log = useHabitStore.getState().logs.find((l) => l.habitId === 'h1' && l.date === TODAY);
    expect(log?.completed).toBe(false); // toggled
    resolvePost({ log: { ...SAMPLE_LOGS[0], completed: false }, habit: SAMPLE_HABITS[0] });
    await promise;
  });
});

describe('useHabitStore — getCompletionRate()', () => {
  it('returns 100 when all logs are completed', () => {
    useHabitStore.setState({
      logs: [
        { id: 'l1', habitId: 'h1', date: TODAY, completed: true },
        { id: 'l2', habitId: 'h2', date: TODAY, completed: true },
      ],
    });
    expect(useHabitStore.getState().getCompletionRate(1)).toBe(100);
  });

  it('returns 50 for half-completed logs', () => {
    useHabitStore.setState({ logs: SAMPLE_LOGS });
    expect(useHabitStore.getState().getCompletionRate(1)).toBe(50);
  });

  it('returns 0 when no logs', () => {
    useHabitStore.setState({ logs: [] });
    expect(useHabitStore.getState().getCompletionRate(7)).toBe(0);
  });
});

describe('useHabitStore — getTodayLogs()', () => {
  it('returns only today\'s logs', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    useHabitStore.setState({
      logs: [
        ...SAMPLE_LOGS,
        { id: 'l3', habitId: 'h1', date: yesterday.toISOString().split('T')[0], completed: true },
      ],
    });
    const todayLogs = useHabitStore.getState().getTodayLogs();
    expect(todayLogs).toHaveLength(2);
    todayLogs.forEach((l) => expect(l.date).toBe(TODAY));
  });
});
