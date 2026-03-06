import type { BreathingSession } from '@/lib/storage';

/** Returns the Monday 00:00:00 of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Formats a duration in seconds as e.g. "1m 30s" or "45s". */
export function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  if (m === 0) return `${sec}s`;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

export function calculateStreak(sessions: { date: string }[]): number {
  if (sessions.length === 0) return 0;

  const dates = Array.from(
    new Set(sessions.map((s) => s.date.split('T')[0])),
  ).sort((a, b) => b.localeCompare(a));

  const today = new Date().toISOString().split('T')[0];

  if (dates[0] !== today) {
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];
    if (dates[0] !== yesterday) return 0;
  }

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00');
    const curr = new Date(dates[i] + 'T00:00:00');
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Computes the average retention time across sessions,
 * guarding against empty arrays to avoid division by zero.
 */
export function safeAvgRetention(sessions: BreathingSession[]): number {
  if (sessions.length === 0) return 0;
  const avgs = sessions.map((s) =>
    s.retentionTimes.length > 0
      ? s.retentionTimes.reduce((a, b) => a + b, 0) / s.retentionTimes.length
      : 0,
  );
  return avgs.reduce((a, b) => a + b, 0) / avgs.length;
}
