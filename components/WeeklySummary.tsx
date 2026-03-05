"use client";

import { useState, useEffect } from "react";
import {
  getBreathingSessions,
  getColdSessions,
  type BreathingSession,
  type ColdSession,
} from "@/lib/storage";
import { strings } from "@/lib/i18n";

const DISMISSED_KEY = "whm_weekly_summary_dismissed";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
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

function computeStreak(sessions: { date: string }[]): number {
  if (sessions.length === 0) return 0;
  const uniqueDays = new Set(
    sessions.map((s) => new Date(s.date).toISOString().slice(0, 10))
  );
  const sorted = Array.from(uniqueDays).sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) return 0;

  let streak = 0;
  let current = sorted[0] === todayStr ? today : yesterday;
  for (let i = 0; i < 365; i++) {
    const dateStr = current.toISOString().slice(0, 10);
    if (uniqueDays.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function shouldShow(): boolean {
  const now = new Date();
  const thisMonday = getMondayOfWeek(now);
  // Only show if we're past Monday (i.e., the previous week is complete)
  // "First app open after Monday" means: current week's Monday has passed
  const dismissed = localStorage.getItem(DISMISSED_KEY);
  if (dismissed) {
    const dismissedDate = new Date(dismissed);
    // Already dismissed for this week
    if (dismissedDate >= thisMonday) return false;
  }
  // Need at least one full previous week of potential data
  return true;
}

function dismiss() {
  localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
}

function getSuggestion(
  sessionDiff: number,
  retTrend: "up" | "down" | "flat",
  coldTotal: number,
  breathingStreak: number
): string {
  const s = strings.weeklySummary.suggestions;
  if (breathingStreak === 0) return s.startStreak;
  if (sessionDiff < 0) return s.moreSessions;
  if (retTrend === "down") return s.focusRetention;
  if (coldTotal === 0) return s.tryCold;
  if (retTrend === "flat") return s.addRound;
  return s.keepItUp;
}

export default function WeeklySummary() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<{
    sessionsLastWeek: number;
    sessionsPrevWeek: number;
    avgRetentionLast: number;
    avgRetentionPrev: number;
    coldTotalLast: number;
    breathingStreak: number;
    coldStreak: number;
    suggestion: string;
  } | null>(null);

  useEffect(() => {
    if (!shouldShow()) return;

    const breathing = getBreathingSessions();
    const cold = getColdSessions();

    if (breathing.length === 0 && cold.length === 0) return;

    const now = new Date();
    const thisMonday = getMondayOfWeek(now);
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(lastMonday.getDate() - 7);
    const prevMonday = new Date(lastMonday);
    prevMonday.setDate(prevMonday.getDate() - 7);

    const inRange = (dateStr: string, start: Date, end: Date) => {
      const d = new Date(dateStr);
      return d >= start && d < end;
    };

    const breathingLastWeek = breathing.filter((s) =>
      inRange(s.date, lastMonday, thisMonday)
    );
    const breathingPrevWeek = breathing.filter((s) =>
      inRange(s.date, prevMonday, lastMonday)
    );
    const coldLastWeek = cold.filter((s) =>
      inRange(s.date, lastMonday, thisMonday)
    );
    const coldPrevWeek = cold.filter((s) =>
      inRange(s.date, prevMonday, lastMonday)
    );

    const sessionsLastWeek = breathingLastWeek.length + coldLastWeek.length;
    const sessionsPrevWeek = breathingPrevWeek.length + coldPrevWeek.length;

    // Need at least some activity last week to show summary
    if (sessionsLastWeek === 0) return;

    const avgRetention = (sessions: BreathingSession[]) => {
      if (sessions.length === 0) return 0;
      const avgs = sessions.map(
        (s) =>
          s.retentionTimes.reduce((a, b) => a + b, 0) / s.retentionTimes.length
      );
      return avgs.reduce((a, b) => a + b, 0) / avgs.length;
    };

    const avgRetentionLast = avgRetention(breathingLastWeek);
    const avgRetentionPrev = avgRetention(breathingPrevWeek);
    const coldTotalLast = coldLastWeek.reduce((sum, s) => sum + s.duration, 0);
    const breathingStreak = computeStreak(breathing);
    const coldStreak = computeStreak(cold);

    const retTrend: "up" | "down" | "flat" =
      avgRetentionLast > avgRetentionPrev + 2
        ? "up"
        : avgRetentionLast < avgRetentionPrev - 2
        ? "down"
        : "flat";

    const sessionDiff = sessionsLastWeek - sessionsPrevWeek;
    const suggestion = getSuggestion(
      sessionDiff,
      retTrend,
      coldTotalLast,
      breathingStreak
    );

    setData({
      sessionsLastWeek,
      sessionsPrevWeek,
      avgRetentionLast,
      avgRetentionPrev,
      coldTotalLast,
      breathingStreak,
      coldStreak,
      suggestion,
    });
    setVisible(true);
  }, []);

  if (!visible || !data) return null;

  const s = strings.weeklySummary;
  const sessionDiff = data.sessionsLastWeek - data.sessionsPrevWeek;
  const retTrend =
    data.avgRetentionLast > data.avgRetentionPrev + 2
      ? "up"
      : data.avgRetentionLast < data.avgRetentionPrev - 2
      ? "down"
      : "flat";
  const trendArrow = retTrend === "up" ? "\u2191" : retTrend === "down" ? "\u2193" : "\u2192";
  const trendColor =
    retTrend === "up"
      ? "text-green-500"
      : retTrend === "down"
      ? "text-red-400"
      : "text-gray-400";

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{s.title}</h2>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sessions comparison */}
        <div className="mb-3 rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">{s.sessions}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {sessionDiff > 0
                ? `+${sessionDiff} vs prev week`
                : sessionDiff < 0
                ? `${sessionDiff} vs prev week`
                : "same as prev week"}
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold">{data.sessionsLastWeek}</p>
        </div>

        {/* Two-column stats */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          {/* Avg retention */}
          <div className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400">{s.avgRetention}</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold">
                {data.avgRetentionLast > 0 ? formatSeconds(data.avgRetentionLast) : "--"}
              </span>
              {data.avgRetentionLast > 0 && (
                <span className={`text-sm ${trendColor}`}>{trendArrow}</span>
              )}
            </div>
          </div>

          {/* Cold total */}
          <div className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400">{s.coldTotal}</span>
            <p className="mt-1 text-xl font-bold">
              {data.coldTotalLast > 0 ? formatSeconds(data.coldTotalLast) : "--"}
            </p>
          </div>
        </div>

        {/* Streaks */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400">{s.breathingStreak}</span>
            <p className="mt-1 text-xl font-bold">
              {data.breathingStreak} <span className="text-xs font-normal text-gray-500">{s.days}</span>
            </p>
          </div>
          <div className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400">{s.coldStreak}</span>
            <p className="mt-1 text-xl font-bold">
              {data.coldStreak} <span className="text-xs font-normal text-gray-500">{s.days}</span>
            </p>
          </div>
        </div>

        {/* Suggestion */}
        <div className="mb-4 rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{s.suggestionLabel}</span>
          <p className="mt-1 text-sm text-blue-900 dark:text-blue-100">{data.suggestion}</p>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white active:bg-blue-600"
        >
          {s.dismiss}
        </button>
      </div>
    </div>
  );
}
