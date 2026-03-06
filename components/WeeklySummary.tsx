"use client";

import { useState, useEffect } from "react";
import {
  getBreathingSessions,
  getColdSessions,
} from "@/lib/storage";
import { strings } from "@/lib/i18n";
import { safeAvgRetention, calculateStreak, startOfWeek, formatSeconds } from "@/lib/analytics";

const DISMISSED_KEY = "whm_weekly_summary_dismissed";

function shouldShow(): boolean {
  const now = new Date();
  const thisMonday = startOfWeek(now);
  // Only show if we're past Monday (i.e., the previous week is complete)
  // "First app open after Monday" means: current week's Monday has passed
  try {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      // Already dismissed for this week
      if (dismissedDate >= thisMonday) return false;
    }
  } catch {
    // localStorage unavailable (e.g. iOS private browsing)
  }
  // Need at least one full previous week of potential data
  return true;
}

function dismiss() {
  try {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
  } catch {
    // localStorage unavailable (e.g. iOS private browsing)
  }
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
    const thisMonday = startOfWeek(now);
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

    const avgRetentionLast = safeAvgRetention(breathingLastWeek);
    const avgRetentionPrev = safeAvgRetention(breathingPrevWeek);
    const coldTotalLast = coldLastWeek.reduce((sum, s) => sum + s.duration, 0);
    const breathingStreak = calculateStreak(breathing);
    const coldStreak = calculateStreak(cold);

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
      ? "text-success"
      : retTrend === "down"
      ? "text-danger-light"
      : "text-on-surface-muted";

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-h-[calc(100dvh-2rem)] max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-surface-raised">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{s.title}</h2>
          <button
            onClick={handleDismiss}
            className="text-on-surface-muted hover:text-on-surface-faint dark:hover:text-on-surface"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sessions comparison */}
        <div className="mb-3 rounded-xl bg-on-surface-light/[0.06] p-3 dark:bg-surface-overlay">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-on-surface-light-muted dark:text-on-surface-muted">{s.sessions}</span>
            <span className="text-xs text-on-surface-muted dark:text-on-surface-faint">
              {sessionDiff > 0
                ? `+${sessionDiff} vs prev week`
                : sessionDiff < 0
                ? `${sessionDiff} vs prev week`
                : "same as prev week"}
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums">{data.sessionsLastWeek}</p>
        </div>

        {/* Two-column stats */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          {/* Avg retention */}
          <div className="rounded-xl bg-on-surface-light/[0.06] p-3 dark:bg-surface-overlay">
            <span className="text-xs text-on-surface-light-muted dark:text-on-surface-muted">{s.avgRetention}</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold tabular-nums">
                {data.avgRetentionLast > 0 ? formatSeconds(data.avgRetentionLast) : "--"}
              </span>
              {data.avgRetentionLast > 0 && (
                <span className={`text-sm ${trendColor}`}>{trendArrow}</span>
              )}
            </div>
          </div>

          {/* Cold total */}
          <div className="rounded-xl bg-on-surface-light/[0.06] p-3 dark:bg-surface-overlay">
            <span className="text-xs text-on-surface-light-muted dark:text-on-surface-muted">{s.coldTotal}</span>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {data.coldTotalLast > 0 ? formatSeconds(data.coldTotalLast) : "--"}
            </p>
          </div>
        </div>

        {/* Streaks */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-on-surface-light/[0.06] p-3 dark:bg-surface-overlay">
            <span className="text-xs text-on-surface-light-muted dark:text-on-surface-muted">{s.breathingStreak}</span>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {data.breathingStreak} <span className="text-xs font-normal text-on-surface-light-muted">{s.days}</span>
            </p>
          </div>
          <div className="rounded-xl bg-on-surface-light/[0.06] p-3 dark:bg-surface-overlay">
            <span className="text-xs text-on-surface-light-muted dark:text-on-surface-muted">{s.coldStreak}</span>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {data.coldStreak} <span className="text-xs font-normal text-on-surface-light-muted">{s.days}</span>
            </p>
          </div>
        </div>

        {/* Suggestion */}
        <div className="mb-4 rounded-xl bg-brand/[0.08] p-3 dark:bg-brand-dark/20">
          <span className="text-xs font-medium text-brand-dark dark:text-brand-light">{s.suggestionLabel}</span>
          <p className="mt-1 text-sm text-on-surface-light dark:text-on-surface">{data.suggestion}</p>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-white active:bg-brand-dark"
        >
          {s.dismiss}
        </button>
      </div>
    </div>
  );
}
