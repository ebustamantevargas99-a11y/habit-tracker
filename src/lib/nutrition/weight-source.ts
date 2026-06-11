import type { PrismaClient } from "@prisma/client";

export type WeightPoint = { date: string; weightKg: number };

/**
 * Fuente única de verdad para el peso del usuario. La tabla WeightLog está
 * huérfana (nadie escribe en ella); el peso real vive en BodyMetric
 * (type="weight") y en BodyComposition.weightKg. Esta función lee ambas y
 * deduplica por fecha (BodyMetric tiene prioridad), ordenado ascendente.
 */
export async function fetchWeightPoints(
  prisma: PrismaClient,
  userId: string,
  sinceStr?: string,
): Promise<WeightPoint[]> {
  const dateFilter = sinceStr ? { gte: sinceStr } : undefined;
  const [metrics, compositions] = await Promise.all([
    prisma.bodyMetric.findMany({
      where: { userId, type: "weight", ...(dateFilter ? { date: dateFilter } : {}) },
      select: { date: true, value: true },
    }),
    prisma.bodyComposition.findMany({
      where: {
        userId,
        weightKg: { not: null },
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      select: { date: true, weightKg: true },
    }),
  ]);

  const byDate = new Map<string, number>();
  for (const c of compositions) {
    if (c.weightKg != null) byDate.set(c.date, c.weightKg);
  }
  for (const m of metrics) byDate.set(m.date, m.value);
  return Array.from(byDate.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, weightKg]) => ({ date, weightKg }));
}
