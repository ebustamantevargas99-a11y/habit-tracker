import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    habitLog: { findMany: vi.fn() },
  },
}));

import {
  recalculateStreak,
  phaseFromStreak,
  daysToNextPhase,
  mondayOfWeek,
  crossedMilestone,
  ROOTED_THRESHOLD,
} from '@/lib/habit-utils';
import { prisma } from '@/lib/prisma';

function dateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function makeLogs(completedDaysAgo: number[]) {
  return completedDaysAgo.map((daysAgo) => ({
    date: dateOffset(daysAgo),
    completed: true,
  }));
}

const mockFindMany = prisma.habitLog.findMany as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFindMany.mockReset();
});

// ─── Fases de arraigo (puras) ────────────────────────────────────────────────

describe('phaseFromStreak', () => {
  it('0 → not_started', () => expect(phaseFromStreak(0)).toBe('not_started'));
  it('1 → starting', () => expect(phaseFromStreak(1)).toBe('starting'));
  it('7 → starting', () => expect(phaseFromStreak(7)).toBe('starting'));
  it('8 → forming', () => expect(phaseFromStreak(8)).toBe('forming'));
  it('21 → forming', () => expect(phaseFromStreak(21)).toBe('forming'));
  it('22 → strengthening', () => expect(phaseFromStreak(22)).toBe('strengthening'));
  it('66 → strengthening', () => expect(phaseFromStreak(66)).toBe('strengthening'));
  it('67 → near_rooted', () => expect(phaseFromStreak(67)).toBe('near_rooted'));
  it('91 → near_rooted', () => expect(phaseFromStreak(91)).toBe('near_rooted'));
  it('92 → rooted', () => expect(phaseFromStreak(92)).toBe('rooted'));
  it('500 → rooted', () => expect(phaseFromStreak(500)).toBe('rooted'));
});

describe('daysToNextPhase', () => {
  it('streak 0 → faltan 1 para starting', () => expect(daysToNextPhase(0)).toBe(1));
  it('streak 5 → faltan 3 para forming', () => expect(daysToNextPhase(5)).toBe(3));
  it('streak 20 → faltan 2 para strengthening', () => expect(daysToNextPhase(20)).toBe(2));
  it('streak 60 → faltan 7 para near_rooted', () => expect(daysToNextPhase(60)).toBe(7));
  it('streak 90 → faltan 2 para rooted', () => expect(daysToNextPhase(90)).toBe(2));
  it('streak 100 (arraigado) → null', () => expect(daysToNextPhase(100)).toBeNull());
  it('rooted threshold constante = 92', () => expect(ROOTED_THRESHOLD).toBe(92));
});

describe('crossedMilestone', () => {
  it('6 → 7 detecta milestone 7', () => expect(crossedMilestone(6, 7)).toBe(7));
  it('7 → 8 no detecta (ya cruzado)', () => expect(crossedMilestone(7, 8)).toBeNull());
  it('91 → 92 detecta milestone 92', () => expect(crossedMilestone(91, 92)).toBe(92));
  it('0 → 21 detecta primer milestone relevante', () => expect(crossedMilestone(0, 21)).toBe(7));
});

describe('mondayOfWeek', () => {
  it('para un miércoles retorna lunes de esa semana', () => {
    // 2026-04-22 es miércoles
    const result = mondayOfWeek(new Date(2026, 3, 22));
    expect(result).toBe('2026-04-20'); // lunes
  });
  it('para un domingo retorna el lunes anterior', () => {
    // 2026-04-26 domingo
    const result = mondayOfWeek(new Date(2026, 3, 26));
    expect(result).toBe('2026-04-20');
  });
  it('para un lunes retorna el mismo lunes', () => {
    const result = mondayOfWeek(new Date(2026, 3, 20));
    expect(result).toBe('2026-04-20');
  });
});

// ─── recalculateStreak ───────────────────────────────────────────────────────

describe('recalculateStreak — daily habit', () => {
  it('streak 10 con 10 días consecutivos', async () => {
    mockFindMany.mockResolvedValue(makeLogs([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    const r = await recalculateStreak('h1', [0, 1, 2, 3, 4, 5, 6]);
    expect(r.streakCurrent).toBe(10);
    expect(r.phase).toBe('forming');
  });

  it('0 logs → streak 0 y phase not_started', async () => {
    mockFindMany.mockResolvedValue([]);
    const r = await recalculateStreak('h1', [0, 1, 2, 3, 4, 5, 6]);
    expect(r.streakCurrent).toBe(0);
    expect(r.phase).toBe('not_started');
  });

  it('gracia cubre 1 día faltante — streak > 3', async () => {
    // Con un hueco pero gracia, streak debe extenderse más allá de los 3 días
    // contiguos iniciales
    mockFindMany.mockResolvedValue(makeLogs([1, 2, 3, 5, 6, 7, 8, 9, 10]));
    const r = await recalculateStreak('h1', [0, 1, 2, 3, 4, 5, 6]);
    expect(r.streakCurrent).toBeGreaterThan(3);
  });

  it('retorna hoursInvested cuando pasa estimatedMinutes', async () => {
    mockFindMany.mockResolvedValue(makeLogs([1, 2, 3, 4, 5])); // 5 completions
    const r = await recalculateStreak('h1', [0, 1, 2, 3, 4, 5, 6], {
      estimatedMinutes: 30,
    });
    expect(r.hoursInvested).toBeCloseTo(2.5, 1); // 5 × 30 / 60 = 2.5h
  });

  it('cuando streak >= 92, phase = rooted y rootedStreak es streak - 91', async () => {
    const daysAgo = Array.from({ length: 100 }, (_, i) => i + 1);
    mockFindMany.mockResolvedValue(makeLogs(daysAgo));
    const r = await recalculateStreak('h1', [0, 1, 2, 3, 4, 5, 6]);
    expect(r.phase).toBe('rooted');
    expect(r.streakCurrent).toBeGreaterThanOrEqual(92);
    expect(r.rootedStreak).toBe(r.streakCurrent - 91);
  });

  it('atRisk true cuando falto ayer y hoy pendiente, y streak > 0', async () => {
    // completé hasta anteayer (día 2), faltó ayer (día 1), hoy pendiente
    mockFindMany.mockResolvedValue(makeLogs([2, 3, 4, 5]));
    const r = await recalculateStreak('h1', [0, 1, 2, 3, 4, 5, 6]);
    expect(r.atRisk).toBe(true);
  });
});
