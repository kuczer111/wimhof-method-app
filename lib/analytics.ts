import type { BreathingSession } from "@/lib/storage";

/**
 * Computes the average retention time across sessions,
 * guarding against empty arrays to avoid division by zero.
 */
export function safeAvgRetention(sessions: BreathingSession[]): number {
  if (sessions.length === 0) return 0;
  const avgs = sessions.map((s) =>
    s.retentionTimes.length > 0
      ? s.retentionTimes.reduce((a, b) => a + b, 0) / s.retentionTimes.length
      : 0
  );
  return avgs.reduce((a, b) => a + b, 0) / avgs.length;
}
