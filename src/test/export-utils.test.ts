import { describe, it, expect } from 'vitest';
import { avg, trend, topN, countBy, lifeScoreFrom, buildMarkdownSummary } from '@/lib/export-utils';

describe('avg()', () => {
  it('returns 0 for empty array', () => {
    expect(avg([])).toBe(0);
  });

  it('calculates average of [1, 2, 3] = 2', () => {
    expect(avg([1, 2, 3])).toBe(2);
  });

  it('rounds to 1 decimal place', () => {
    expect(avg([1, 2, 4])).toBe(2.3);
  });

  it('works with single value', () => {
    expect(avg([42])).toBe(42);
  });
});

describe('trend()', () => {
  it('returns "stable" when older = 0 (avoid division by zero)', () => {
    expect(trend([100], [])).toBe('stable');
  });

  it('returns "improving" when recent avg is >10% higher than older', () => {
    expect(trend([120], [100])).toBe('improving');  // +20%
  });

  it('returns "declining" when recent avg is >10% lower than older', () => {
    expect(trend([80], [100])).toBe('declining');   // -20%
  });

  it('returns "stable" when within ±10% band', () => {
    expect(trend([105], [100])).toBe('stable');     // +5%
    expect(trend([97], [100])).toBe('stable');      // -3%
  });

  it('handles arrays of multiple values', () => {
    expect(trend([110, 120, 130], [100, 100, 100])).toBe('improving');
  });
});

describe('topN()', () => {
  const items = [
    { name: 'C', score: 3 },
    { name: 'A', score: 1 },
    { name: 'B', score: 2 },
    { name: 'E', score: 5 },
    { name: 'D', score: 4 },
  ];

  it('returns top 3 by score descending', () => {
    const result = topN(items, 'score', 3);
    expect(result.map((x) => x.name)).toEqual(['E', 'D', 'C']);
  });

  it('defaults to top 5', () => {
    expect(topN(items, 'score')).toHaveLength(5);
  });

  it('returns all items when n > array length', () => {
    expect(topN(items, 'score', 10)).toHaveLength(5);
  });

  it('does not mutate the original array', () => {
    const copy = [...items];
    topN(items, 'score', 3);
    expect(items).toEqual(copy);
  });
});

describe('countBy()', () => {
  const fruits = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple'];

  it('counts occurrences by function', () => {
    const result = countBy(fruits, (f) => f);
    expect(result.find((r) => r.key === 'apple')?.count).toBe(3);
    expect(result.find((r) => r.key === 'banana')?.count).toBe(2);
  });

  it('sorts by count descending', () => {
    const result = countBy(fruits, (f) => f);
    expect(result[0].key).toBe('apple');
    expect(result[1].key).toBe('banana');
  });

  it('returns empty array for empty input', () => {
    expect(countBy([], (x) => String(x))).toEqual([]);
  });
});

describe('lifeScoreFrom()', () => {
  it('returns 0 when all parts are 0', () => {
    expect(lifeScoreFrom({ habits: 0, fitness: 0, finance: 0, productivity: 0 })).toBe(0);
  });

  it('returns 100 when all parts are 100', () => {
    expect(lifeScoreFrom({ habits: 100, fitness: 100, finance: 100, productivity: 100 })).toBe(100);
  });

  it('weights are correct: habits(0.28)+fitness(0.28)+finance(0.22)+productivity(0.22) = 1.0', () => {
    // Cross-check: only one area at 100 → result = that area's weight * 100
    expect(lifeScoreFrom({ habits: 100, fitness: 0, finance: 0, productivity: 0 })).toBe(28);
    expect(lifeScoreFrom({ habits: 0, fitness: 0, finance: 100, productivity: 0 })).toBe(22);
    expect(lifeScoreFrom({ habits: 0, fitness: 0, finance: 0, productivity: 100 })).toBe(22);
  });
});

describe('buildMarkdownSummary()', () => {
  it('generates markdown with ## headings', () => {
    const result = buildMarkdownSummary([
      { title: 'Hábitos', lines: ['Racha: 10 días'] },
    ]);
    expect(result).toContain('## Hábitos');
  });

  it('generates bullet points for each line', () => {
    const result = buildMarkdownSummary([
      { title: 'Fitness', lines: ['Press Banca: 95kg', 'Sentadilla: 130kg'] },
    ]);
    expect(result).toContain('- Press Banca: 95kg');
    expect(result).toContain('- Sentadilla: 130kg');
  });

  it('separates sections with double newline', () => {
    const result = buildMarkdownSummary([
      { title: 'A', lines: ['line1'] },
      { title: 'B', lines: ['line2'] },
    ]);
    expect(result).toContain('\n\n');
  });
});
