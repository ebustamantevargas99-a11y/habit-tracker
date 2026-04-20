import { describe, it, expect, beforeEach } from 'vitest';
import { generateMilestones, evaluateMilestoneStatus, recalculateMilestones } from '@/lib/projection-engine';
import type { ProjectionConfig, Milestone } from '@/stores/okr-store';

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const BASE_CFG: ProjectionConfig = {
  objectiveId: 'obj-test',
  baseline: 0,
  goal: 100,
  unit: 'kg',
  endDate: futureDate(84), // 12 weeks out
  progression: 'linear',
  alertThreshold: 0.1,
  autoGenerateMilestones: true,
};

describe('generateMilestones()', () => {
  let milestones: Milestone[];

  beforeEach(() => {
    milestones = generateMilestones(BASE_CFG, 'obj-1');
  });

  it('generates one milestone per week', () => {
    // 84 days = 12 weeks
    expect(milestones.length).toBe(12);
  });

  it('first milestone has weekNumber = 1', () => {
    expect(milestones[0].weekNumber).toBe(1);
  });

  it('last milestone target value equals goal for linear progression', () => {
    expect(milestones[milestones.length - 1].targetValue).toBeCloseTo(100, 0);
  });

  it('milestones are sorted by weekNumber', () => {
    for (let i = 1; i < milestones.length; i++) {
      expect(milestones[i].weekNumber).toBeGreaterThan(milestones[i - 1].weekNumber);
    }
  });

  it('each milestone starts as pending with actualValue = 0', () => {
    milestones.forEach((m) => {
      expect(m.status).toBe('pending');
      expect(m.actualValue).toBe(0);
    });
  });

  it('linear progression increases monotonically', () => {
    for (let i = 1; i < milestones.length; i++) {
      expect(milestones[i].targetValue).toBeGreaterThan(milestones[i - 1].targetValue);
    }
  });

  it('logarithmic progression front-loads gains', () => {
    const logCfg = { ...BASE_CFG, progression: 'logarithmic' as const };
    const logMs = generateMilestones(logCfg, 'obj-log');
    const linMs = generateMilestones(BASE_CFG, 'obj-lin');
    // Early log milestone should be higher than linear
    expect(logMs[1].targetValue).toBeGreaterThan(linMs[1].targetValue);
    // Both should converge near the end
    const last = logMs.length - 1;
    expect(logMs[last].targetValue).toBeCloseTo(linMs[last].targetValue, 0);
  });
});

describe('evaluateMilestoneStatus()', () => {
  const cfg: ProjectionConfig = { ...BASE_CFG, alertThreshold: 0.1 };

  it('returns "pending" for future milestone with no progress', () => {
    const m: Milestone = {
      id: 'm1', objectiveId: 'o1', weekNumber: 5,
      targetDate: futureDate(10), targetValue: 50, actualValue: 0,
      status: 'pending', recalculated: false,
    };
    expect(evaluateMilestoneStatus(m, cfg)).toBe('pending');
  });

  it('returns "hit" for past milestone where actual >= target', () => {
    const m: Milestone = {
      id: 'm2', objectiveId: 'o1', weekNumber: 2,
      targetDate: pastDate(3), targetValue: 20, actualValue: 22,
      status: 'pending', recalculated: false,
    };
    expect(evaluateMilestoneStatus(m, cfg)).toBe('hit');
  });

  it('returns "missed" for past milestone with large deficit', () => {
    const m: Milestone = {
      id: 'm3', objectiveId: 'o1', weekNumber: 3,
      targetDate: pastDate(5), targetValue: 30, actualValue: 5, // 83% deficit
      status: 'pending', recalculated: false,
    };
    expect(evaluateMilestoneStatus(m, cfg)).toBe('missed');
  });

  it('returns "at_risk" for past milestone just below threshold', () => {
    const m: Milestone = {
      id: 'm4', objectiveId: 'o1', weekNumber: 4,
      targetDate: pastDate(2), targetValue: 40, actualValue: 37, // ~7.5% deficit < 10%
      status: 'pending', recalculated: false,
    };
    expect(evaluateMilestoneStatus(m, cfg)).toBe('at_risk');
  });
});

describe('recalculateMilestones()', () => {
  it('redistributes remaining milestones from missed week', () => {
    const ms = generateMilestones(BASE_CFG, 'obj-r');
    const { milestones: updated, atRisk } = recalculateMilestones(ms, 1, 5, BASE_CFG);

    // Milestones before missed week unchanged
    expect(updated[0].weekNumber).toBe(1);

    // Remaining milestones are recalculated
    const remaining = updated.filter((m) => m.weekNumber > 1);
    remaining.forEach((m) => expect(m.recalculated).toBe(true));

    // atRisk flag should be a boolean
    expect(typeof atRisk).toBe('boolean');
  });
});
