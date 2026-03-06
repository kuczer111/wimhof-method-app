import type { BreathingSession } from '@/lib/storage';

export interface ChartPoint {
  label: string;
  avgRetention: number;
  date: string;
  isPR: boolean;
  rounds: number[];
  weekKey: string;
  trend?: number;
  weeklyAvg?: number;
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function computeTrendLine(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  const sumX = points.reduce((a, p) => a + p.x, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumX2 = points.reduce((a, p) => a + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function buildChartData(sessions: BreathingSession[]) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let maxRetention = 0;
  let maxR = 0;

  const points: ChartPoint[] = sorted.map((s) => {
    const sessionAvg =
      s.retentionTimes.length > 0
        ? s.retentionTimes.reduce((a, b) => a + b, 0) / s.retentionTimes.length
        : 0;
    const rounded = Math.round(sessionAvg);
    const isPR = rounded > maxRetention;
    if (isPR) maxRetention = rounded;
    if (s.retentionTimes.length > maxR) maxR = s.retentionTimes.length;
    return {
      label: new Date(s.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      avgRetention: rounded,
      date: s.date,
      isPR,
      rounds: s.retentionTimes.map((t) => Math.round(t)),
      weekKey: getWeekKey(s.date),
    };
  });

  const weekGroups: Record<string, number[]> = {};
  for (const p of points) {
    if (!weekGroups[p.weekKey]) weekGroups[p.weekKey] = [];
    weekGroups[p.weekKey].push(p.avgRetention);
  }
  const weekAvgs: Record<string, number> = {};
  for (const [key, vals] of Object.entries(weekGroups)) {
    weekAvgs[key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  const trendPoints = points.map((p, i) => ({ x: i, y: p.avgRetention }));
  const { slope, intercept } = computeTrendLine(trendPoints);

  for (let i = 0; i < points.length; i++) {
    points[i].trend = Math.round(slope * i + intercept);
    points[i].weeklyAvg = weekAvgs[points[i].weekKey];
  }

  const totalAvg =
    points.length > 0
      ? Math.round(
          points.reduce((a, p) => a + p.avgRetention, 0) / points.length,
        )
      : 0;

  return {
    data: points,
    avg: totalAvg,
    prValue: maxRetention,
    maxRounds: maxR,
  };
}
