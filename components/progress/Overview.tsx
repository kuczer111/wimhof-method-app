"use client";

import { BreathingSession, ColdSession } from "@/lib/storage";
import { strings } from "@/lib/i18n";
import { safeAvgRetention, calculateStreak } from "@/lib/analytics";
import InsightCard from "@/components/progress/InsightCard";

interface OverviewProps {
  breathingSessions: BreathingSession[];
  coldSessions: ColdSession[];
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = start
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  if (m === 0) return `${sec}s`;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

export default function Overview({ breathingSessions, coldSessions }: OverviewProps) {
  const s = strings.progress.overview;
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const inRange = (dateStr: string, start: Date, end: Date) => {
    const d = new Date(dateStr);
    return d >= start && d < end;
  };

  // Weekly session counts
  const breathingThisWeek = breathingSessions.filter((s) =>
    inRange(s.date, thisWeekStart, now)
  );
  const breathingLastWeek = breathingSessions.filter((s) =>
    inRange(s.date, lastWeekStart, thisWeekStart)
  );
  const coldThisWeek = coldSessions.filter((s) =>
    inRange(s.date, thisWeekStart, now)
  );

  const totalThisWeek = breathingThisWeek.length + coldThisWeek.length;
  const totalLastWeek =
    breathingLastWeek.length +
    coldSessions.filter((s) => inRange(s.date, lastWeekStart, thisWeekStart))
      .length;
  const weekDiff = totalThisWeek - totalLastWeek;

  // Average retention trend
  const retThis = safeAvgRetention(breathingThisWeek);
  const retLast = safeAvgRetention(breathingLastWeek);
  const retTrend = retThis > retLast + 2 ? "up" : retThis < retLast - 2 ? "down" : "flat";

  // Cold total this week
  const coldTotalSec = coldThisWeek.reduce((sum, s) => sum + s.duration, 0);

  // Streaks
  const breathingStreak = calculateStreak(breathingSessions);
  const coldStreak = calculateStreak(coldSessions);

  // Consistency: unique days with any session this week / 7
  const daysWithSession = new Set<string>();
  breathingThisWeek.forEach((s) =>
    daysWithSession.add(new Date(s.date).toISOString().slice(0, 10))
  );
  coldThisWeek.forEach((s) =>
    daysWithSession.add(new Date(s.date).toISOString().slice(0, 10))
  );
  // Days elapsed in current week (at least 1)
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const consistency = Math.round((daysWithSession.size / dayOfWeek) * 100);

  if (breathingSessions.length === 0 && coldSessions.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {s.noData}
      </p>
    );
  }

  const trendArrow =
    retTrend === "up" ? "\u2191" : retTrend === "down" ? "\u2193" : "\u2192";
  const trendColor =
    retTrend === "up"
      ? "text-green-500"
      : retTrend === "down"
      ? "text-red-400"
      : "text-gray-400";

  return (
    <div className="space-y-4">
      {/* Weekly summary */}
      <div className="rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {s.thisWeek}
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {s.vsLastWeek(weekDiff)}
          </span>
        </div>
        <p className="mt-1 text-3xl font-bold">
          {totalThisWeek}{" "}
          <span className="text-base font-normal text-gray-500 dark:text-gray-400">
            {s.sessions}
          </span>
        </p>
      </div>

      {/* Two-column cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Avg retention */}
        <div className="rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {s.avgRetention}
          </h3>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold">
              {retThis > 0 ? formatSeconds(retThis) : "--"}
            </span>
            {retThis > 0 && (
              <span className={`text-lg ${trendColor}`}>{trendArrow}</span>
            )}
          </div>
        </div>

        {/* Cold total */}
        <div className="rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {s.coldTotal}
          </h3>
          <p className="mt-1 text-2xl font-bold">
            {coldTotalSec > 0 ? formatSeconds(coldTotalSec) : "--"}
          </p>
        </div>

        {/* Breathing streak */}
        <div className="rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {s.breathingStreak}
          </h3>
          <p className="mt-1 text-2xl font-bold">
            {breathingStreak}{" "}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {s.days}
            </span>
          </p>
        </div>

        {/* Cold streak */}
        <div className="rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {s.coldStreak}
          </h3>
          <p className="mt-1 text-2xl font-bold">
            {coldStreak}{" "}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {s.days}
            </span>
          </p>
        </div>
      </div>

      {/* Insight card */}
      <InsightCard sessions={breathingSessions} />

      {/* Consistency */}
      <div className="rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {s.consistency}
          </h3>
          <span className="text-2xl font-bold">{consistency}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Weekly consistency"
          aria-valuenow={consistency}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
        >
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(consistency, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
