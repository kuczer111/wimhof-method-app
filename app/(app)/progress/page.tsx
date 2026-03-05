"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Dot,
} from "recharts";
import Card from "@/components/ui/Card";
import {
  getBreathingSessions,
  getColdSessions,
  BreathingSession,
  ColdSession,
} from "@/lib/storage";
import { formatDuration } from "@/lib/format";
import { strings } from "@/lib/i18n";

type Tab = "breathing" | "cold";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ChartPoint {
  label: string;
  avgRetention: number;
  date: string;
  isPR: boolean;
}

function PRDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  const { cx, cy, payload } = props;
  if (!payload?.isPR) return null;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={6}
      fill="#facc15"
      stroke="#facc15"
      strokeWidth={2}
    />
  );
}

function RetentionChart({ sessions }: { sessions: BreathingSession[] }) {
  const { data, avg, prValue } = useMemo(() => {
    // Sort chronologically (oldest first) for the chart
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let maxRetention = 0;
    const points: ChartPoint[] = sorted.map((s) => {
      const sessionAvg =
        s.retentionTimes.length > 0
          ? s.retentionTimes.reduce((a, b) => a + b, 0) / s.retentionTimes.length
          : 0;
      const rounded = Math.round(sessionAvg);
      const isPR = rounded > maxRetention;
      if (isPR) maxRetention = rounded;
      return {
        label: new Date(s.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        avgRetention: rounded,
        date: s.date,
        isPR,
      };
    });

    const totalAvg =
      points.length > 0
        ? Math.round(points.reduce((a, p) => a + p.avgRetention, 0) / points.length)
        : 0;

    return { data: points, avg: totalAvg, prValue: maxRetention };
  }, [sessions]);

  if (sessions.length < 2) return null;

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          {strings.progress.chart.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 bg-blue-400" /> {strings.progress.chart.avgLegend}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" /> {strings.progress.chart.prLegend}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}s`}
          />
          <Tooltip
            contentStyle={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#9ca3af" }}
            formatter={(value: number) => [`${value}s`, strings.progress.chart.tooltipLabel]}
          />
          <ReferenceLine
            y={avg}
            stroke="#60a5fa"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Line
            type="monotone"
            dataKey="avgRetention"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={<PRDot />}
            activeDot={{ r: 4, fill: "#3b82f6" }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>{strings.progress.chart.overallAvg(avg)}</span>
        <span>{strings.progress.chart.pr(prValue)}</span>
      </div>
    </Card>
  );
}

function BreathingList({ sessions }: { sessions: BreathingSession[] }) {
  if (sessions.length === 0) {
    return (
      <p className="mt-8 text-center text-gray-500">
        {strings.progress.breathingEmpty}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => (
        <Card key={s.id}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(s.date)}</p>
              <p className="mt-1 font-semibold">
                {strings.progress.roundLabel(s.rounds)}
              </p>
            </div>
            {s.feelingRating && (
              <span className="text-lg">
                {"*".repeat(s.feelingRating)}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {s.retentionTimes.map((t, i) => (
              <span
                key={i}
                className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
              >
                R{i + 1}: {formatDuration(t)}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {strings.progress.totalLabel(formatDuration(s.totalDuration))}
          </p>
        </Card>
      ))}
    </div>
  );
}

function ColdStats({ sessions }: { sessions: ColdSession[] }) {
  const { totalMinutes, streak, calendarDays } = useMemo(() => {
    const totalSec = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalMin = Math.round(totalSec / 60);

    // Build set of session date strings (YYYY-MM-DD)
    const sessionDates = new Set(
      sessions.map((s) => new Date(s.date).toISOString().slice(0, 10))
    );

    // Calculate current streak (consecutive days ending today or yesterday)
    let streakCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(today);

    // Allow streak to start from today or yesterday
    if (!sessionDates.has(checkDate.toISOString().slice(0, 10))) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (sessionDates.has(checkDate.toISOString().slice(0, 10))) {
      streakCount++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Build 12-week (84 days) calendar grid
    const days: { date: string; hasSession: boolean }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, hasSession: sessionDates.has(key) });
    }

    return { totalMinutes: totalMin, streak: streakCount, calendarDays: days };
  }, [sessions]);

  if (sessions.length === 0) return null;

  // Group days into weeks (columns of 7)
  const weeks: typeof calendarDays[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
        {strings.progress.coldStats.title}
      </h3>
      <div className="mb-4 flex gap-4">
        <div className="flex-1 rounded-lg bg-gray-100 p-3 text-center dark:bg-gray-900">
          <p className="text-2xl font-bold text-cyan-400">{totalMinutes}</p>
          <p className="text-xs text-gray-500">{strings.progress.coldStats.totalMinutes}</p>
        </div>
        <div className="flex-1 rounded-lg bg-gray-100 p-3 text-center dark:bg-gray-900">
          <p className="text-2xl font-bold text-cyan-400">{streak}</p>
          <p className="text-xs text-gray-500">{strings.progress.coldStats.dayStreak}</p>
        </div>
      </div>
      <p className="mb-2 text-xs text-gray-500">{strings.progress.coldStats.last12Weeks}</p>
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                title={day.date}
                className={`h-3 w-3 rounded-sm ${
                  day.hasSession
                    ? "bg-cyan-500"
                    : "bg-gray-200 dark:bg-gray-800"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ColdList({ sessions }: { sessions: ColdSession[] }) {
  if (sessions.length === 0) {
    return (
      <p className="mt-8 text-center text-gray-500">
        {strings.progress.coldEmpty}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => (
        <Card key={s.id}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(s.date)}</p>
              <p className="mt-1 font-semibold">{formatDuration(s.duration)}</p>
            </div>
            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs capitalize text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-300">
              {s.type}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>{strings.progress.coldTarget(formatDuration(s.targetDuration))}</span>
            {s.temperature != null && <span>{s.temperature}{strings.cold.temperatureUnit}</span>}
            {s.rating && <span>{strings.progress.coldRating(s.rating)}</span>}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>("breathing");
  const [breathingSessions, setBreathingSessions] = useState<BreathingSession[]>([]);
  const [coldSessions, setColdSessions] = useState<ColdSession[]>([]);

  useEffect(() => {
    setBreathingSessions(
      getBreathingSessions().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
    setColdSessions(
      getColdSessions().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
  }, []);

  return (
    <div className="flex flex-col px-4 pb-24 pt-8">
      <h1 className="text-2xl font-bold">{strings.progress.heading}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{strings.progress.subtitle}</p>

      {/* Tabs */}
      <div className="mt-6 flex rounded-xl bg-gray-100 p-1 dark:bg-gray-900">
        {(["breathing", "cold"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-4">
        {tab === "breathing" ? (
          <div className="flex flex-col gap-4">
            <RetentionChart sessions={breathingSessions} />
            <BreathingList sessions={breathingSessions} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <ColdStats sessions={coldSessions} />
            <ColdList sessions={coldSessions} />
          </div>
        )}
      </div>
    </div>
  );
}
