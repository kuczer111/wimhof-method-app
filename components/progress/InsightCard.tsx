import type { BreathingSession } from "@/lib/storage";
import { strings } from "@/lib/i18n";

interface InsightCardProps {
  sessions: BreathingSession[];
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function avgRetention(sessions: BreathingSession[]): number {
  if (sessions.length === 0) return 0;
  const avgs = sessions.map(
    (s) =>
      s.retentionTimes.length > 0
        ? s.retentionTimes.reduce((a, b) => a + b, 0) / s.retentionTimes.length
        : 0
  );
  return avgs.reduce((a, b) => a + b, 0) / avgs.length;
}

export default function InsightCard({ sessions }: InsightCardProps) {
  const s = strings.progress.insight;

  // Need at least 2 weeks of data
  if (sessions.length < 3) return null;

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const earliest = new Date(sorted[0].date);
  const latest = new Date(sorted[sorted.length - 1].date);
  const spanDays = (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24);
  if (spanDays < 14) return null;

  // Split into recent week vs prior week
  const now = new Date();
  const thisWeekStart = getWeekStart(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const twoWeeksAgoStart = new Date(lastWeekStart);
  twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 7);

  const recentSessions = sorted.filter((se) => {
    const d = new Date(se.date);
    return d >= lastWeekStart;
  });
  const priorSessions = sorted.filter((se) => {
    const d = new Date(se.date);
    return d >= twoWeeksAgoStart && d < lastWeekStart;
  });

  if (recentSessions.length === 0 || priorSessions.length === 0) return null;

  const recentAvg = avgRetention(recentSessions);
  const priorAvg = avgRetention(priorSessions);

  const changePct = priorAvg > 0 ? Math.round(((recentAvg - priorAvg) / priorAvg) * 100) : 0;

  let pattern: "improving" | "plateau" | "declining";
  if (changePct > 5) pattern = "improving";
  else if (changePct < -5) pattern = "declining";
  else pattern = "plateau";

  const patternText =
    pattern === "improving"
      ? s.improving(changePct)
      : pattern === "declining"
      ? s.declining
      : s.plateau;

  // Suggestion based on pattern and session data
  const avgRounds = Math.round(
    recentSessions.reduce((a, se) => a + se.rounds, 0) / recentSessions.length
  );

  let suggestion: string;
  if (pattern === "improving" && avgRounds <= 3) {
    suggestion = s.tryMoreRounds;
  } else if (pattern === "plateau") {
    suggestion = s.trySlowerPace;
  } else {
    suggestion = s.keepGoing;
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
      <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
        {s.title}
      </h3>
      <p className="mt-1 text-sm text-blue-900 dark:text-blue-100">
        {patternText}
      </p>
      <div className="mt-3 rounded-lg bg-blue-100/50 px-3 py-2 dark:bg-blue-900/30">
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {s.suggestion}
        </p>
        <p className="mt-0.5 text-xs text-blue-800 dark:text-blue-200">
          {suggestion}
        </p>
      </div>
    </div>
  );
}
