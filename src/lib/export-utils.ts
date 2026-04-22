/**
 * Pure helper functions used by the AI-context export endpoint.
 * Extracted here to be independently testable.
 */

export function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function trend(recent: number[], older: number[]): "improving" | "declining" | "stable" {
  const r = avg(recent);
  const o = avg(older);
  if (o === 0) return "stable";
  const change = (r - o) / o;
  if (change > 0.10) return "improving";
  if (change < -0.10) return "declining";
  return "stable";
}

export function topN<T extends Record<string, unknown>>(
  arr: T[],
  key: keyof T,
  n = 5
): T[] {
  return [...arr].sort((a, b) => (b[key] as number) - (a[key] as number)).slice(0, n);
}

export function countBy<T>(arr: T[], fn: (item: T) => string): { key: string; count: number }[] {
  const map: Record<string, number> = {};
  arr.forEach((item) => {
    const k = fn(item);
    map[k] = (map[k] ?? 0) + 1;
  });
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export function lifeScoreFrom(parts: {
  habits: number;
  fitness: number;
  finance: number;
  productivity: number;
}): number {
  // Pesos redistribuidos al eliminar la dimensión wellness (sumaba 0.22).
  return Math.round(
    parts.habits * 0.28 +
    parts.fitness * 0.28 +
    parts.finance * 0.22 +
    parts.productivity * 0.22
  );
}

export function buildMarkdownSummary(sections: { title: string; lines: string[] }[]): string {
  return sections
    .map(({ title, lines }) => `## ${title}\n${lines.map((l) => `- ${l}`).join('\n')}`)
    .join('\n\n');
}
