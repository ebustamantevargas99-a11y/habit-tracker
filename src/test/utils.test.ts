import { describe, it, expect } from 'vitest';
import {
  calculateHabitStrength,
  compoundEffect,
  estimate1RM,
  percentChange,
  cn,
} from '@/lib/utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  it('merges conflicting Tailwind classes (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});

describe('calculateHabitStrength()', () => {
  it('returns 0 for zero inputs', () => {
    expect(calculateHabitStrength(0, 0, 0)).toBe(0);
  });

  it('caps streak factor at 66 days (40 points)', () => {
    const withLongStreak = calculateHabitStrength(100, 0, 0);
    const withExactStreak = calculateHabitStrength(66, 0, 0);
    expect(withLongStreak).toBe(withExactStreak); // both capped at 40
  });

  it('calculates correctly with streak=30, completed=25, consistency=0.8', () => {
    const streakFactor = Math.min(30 / 66, 1) * 40;        // ~18.18
    const completionFactor = (25 / 30) * 40;               // ~33.33
    const consistencyFactor = 0.8 * 20;                    // 16
    const expected = Math.round(streakFactor + completionFactor + consistencyFactor);
    expect(calculateHabitStrength(30, 25, 0.8)).toBe(expected);
  });

  it('returns 100 for perfect inputs (66+ streak, 30 completed, 1.0 consistency)', () => {
    expect(calculateHabitStrength(66, 30, 1.0)).toBe(100);
  });
});

describe('compoundEffect()', () => {
  it('returns 1 with zero rate', () => {
    expect(compoundEffect(0, 365)).toBe(1);
  });

  it('1% daily for 365 days ≈ 37.78x', () => {
    const result = compoundEffect(1, 365);
    expect(result).toBeCloseTo(37.78, 0);
  });

  it('returns > 1 for positive rate and days', () => {
    expect(compoundEffect(0.5, 100)).toBeGreaterThan(1);
  });
});

describe('estimate1RM()', () => {
  it('returns weight directly when reps = 1', () => {
    expect(estimate1RM(100, 1)).toBe(100);
  });

  it('100kg × 5 reps produces Epley 1RM ≈ 116.7kg', () => {
    // Epley: weight * (1 + reps/30) = 100 * (1 + 5/30) = 100 * 1.1667 = 116.67
    expect(estimate1RM(100, 5)).toBeCloseTo(116.7, 0);
  });

  it('80kg × 10 reps ≈ 106.7kg', () => {
    expect(estimate1RM(80, 10)).toBeCloseTo(106.7, 0);
  });
});

describe('percentChange()', () => {
  it('returns 0 when previous is 0 (avoid division by zero)', () => {
    expect(percentChange(100, 0)).toBe(0);
  });

  it('returns 50 for 100 → 150', () => {
    expect(percentChange(150, 100)).toBe(50);
  });

  it('returns -25 for 100 → 75', () => {
    expect(percentChange(75, 100)).toBe(-25);
  });

  it('returns 0 for equal values', () => {
    expect(percentChange(80, 80)).toBe(0);
  });
});
