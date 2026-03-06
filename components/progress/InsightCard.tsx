import type { BreathingSession } from "@/lib/storage";
import { strings } from "@/lib/i18n";
import { safeAvgRetention, startOfWeek } from "@/lib/analytics";

interface InsightCardProps {
  sessions: BreathingSession[];
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
  const thisWeekStart = startOfWeek(now);
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

  const recentAvg = safeAvgRetention(recentSessions);
  const priorAvg = safeAvgRetention(priorSessions);

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
    <div className="rounded-2xl border border-brand/20 bg-brand/[0.06] p-4 dark:border-brand-dark/30 dark:bg-brand-dark/10">
      <h3 className="text-sm font-semibold text-brand-dark dark:text-brand-light">
        {s.title}
      </h3>
      <p className="mt-1 text-sm text-on-surface-faint dark:text-on-surface-muted">
        {patternText}
      </p>
      <div className="mt-3 rounded-lg bg-brand/10 px-3 py-2 dark:bg-brand-dark/20">
        <p className="text-xs font-medium text-brand dark:text-brand-light">
          {s.suggestion}
        </p>
        <p className="mt-0.5 text-xs text-brand-dark dark:text-brand-light">
          {suggestion}
        </p>
      </div>
    </div>
  );
}
