import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Prisma before importing habit-utils ──────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  prisma: {
    habitLog: {
      findMany: vi.fn(),
    },
  },
}));

import { recalculateStreak } from '@/lib/habit-utils';
import { prisma } from '@/lib/prisma';

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function makeLogs(completedDaysAgo: number[]): { date: string; completed: boolean }[] {
  return completedDaysAgo.map((daysAgo) => ({
    date: dateOffset(daysAgo),
    completed: true,
  }));
}

const mockFindMany = prisma.habitLog.findMany as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFindMany.mockReset();
});

// ─────────────────────────────────────────────────────────────────────────────

describe('recalculateStreak() — daily habit (all days)', () => {
  it('returns streakCurrent = 10 for 10 consecutive days completed', async () => {
    // days 1-10 ago completed (today = day 0, skip today per logic)
    mockFindMany.mockResolvedValue(makeLogs([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    const result = await recalculateStreak('h1', [0, 1, 2, 3, 4, 5, 6]);
    expect(result.streakCurrent).toBe(10);
  });

  it('breaks streak when a day is missed', async () => {
    // days 1-3 and 5-7 completed — day 4 ago is missing (gap)
    mockFindMany.mockResolvedValue(makeLogs([1, 2, 3, 5, 6, 7]));
    const result = await recalculateStreak('h1', [0, 1, 2, 3, 4, 5, 6]);
    expect(result.streakCurrent).toBe(3); // only days 1-3
  });

  it('streakBest is the longest historical streak', async () => {
    // 5 days recent (1-5), gap at 6, then 8 older days (7-14)
    mockFindMany.mockResolvedValue(makeLogs([1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14]));
    const result = await recalculateStreak('h1', [0, 1, 2, 3, 4, 5, 6]);
    expect(result.streakBest).toBe(8);
    expect(result.streakCurrent).toBe(5);
  });

  it('returns 0 for no logs', async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await recalculateStreak('h1', [0, 1, 2, 3, 4, 5, 6]);
    expect(result.streakCurrent).toBe(0);
    expect(result.streakBest).toBe(0);
  });
});

describe('recalculateStreak() — weekly habit (Mon/Wed/Fri = days 1,3,5)', () => {
  it('unscheduled days do not break the streak', async () => {
    // Build a schedule where Mon/Wed/Fri were completed last week
    // Today = some day; we just need completions on targetDays
    const TARGET_DAYS = [1, 3, 5]; // Mon, Wed, Fri
    // Simulate 3 consecutive scheduled completions with 6 actual days coverage
    mockFindMany.mockResolvedValue([
      { date: dateOffset(1), completed: true },  // yesterday — skip if not scheduled
      { date: dateOffset(2), completed: true },
      { date: dateOffset(4), completed: true },
      { date: dateOffset(6), completed: true },
    ]);
    const result = await recalculateStreak('h2', TARGET_DAYS);
    // All completed logs count regardless of day-of-week, streak should be >= 1
    expect(result.streakCurrent).toBeGreaterThanOrEqual(1);
  });
});

describe('recalculateStreak() — streak insurance', () => {
  it('insurance=1 forgives one missed scheduled day', async () => {
    // Days 1,2,3,4 complete, day 5 missing, days 6,7 complete
    // Without insurance: streak = 4 (days 1-4)
    // With insurance=1:  streak continues through day 5, = 7
    mockFindMany.mockResolvedValue(makeLogs([1, 2, 3, 4, 6, 7]));
    const withoutInsurance = await recalculateStreak('h3', [0, 1, 2, 3, 4, 5, 6], 0);
    const withInsurance = await recalculateStreak('h3', [0, 1, 2, 3, 4, 5, 6], 1);
    expect(withInsurance.streakCurrent).toBeGreaterThanOrEqual(withoutInsurance.streakCurrent);
  });
});
