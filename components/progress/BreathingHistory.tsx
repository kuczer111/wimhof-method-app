import { useMemo, useState } from "react";
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
import type { BreathingSession } from "@/lib/storage";
import { formatDuration } from "@/lib/format";
import { strings } from "@/lib/i18n";

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
  rounds: number[];
  weekKey: string;
  trend?: number;
  weeklyAvg?: number;
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

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function computeTrendLine(points: { x: number; y: number }[]): { slope: number; intercept: number } {
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

type ChartMode = "avg" | "rounds";

function RetentionChart({ sessions }: { sessions: BreathingSession[] }) {
  const [mode, setMode] = useState<ChartMode>("avg");

  const { data, avg, prValue, maxRounds } = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
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
          month: "short",
          day: "numeric",
        }),
        avgRetention: rounded,
        date: s.date,
        isPR,
        rounds: s.retentionTimes.map((t) => Math.round(t)),
        weekKey: getWeekKey(s.date),
      };
    });

    // Compute weekly averages
    const weekGroups: Record<string, number[]> = {};
    for (const p of points) {
      if (!weekGroups[p.weekKey]) weekGroups[p.weekKey] = [];
      weekGroups[p.weekKey].push(p.avgRetention);
    }
    const weekAvgs: Record<string, number> = {};
    for (const [key, vals] of Object.entries(weekGroups)) {
      weekAvgs[key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }

    // Compute trend line
    const trendPoints = points.map((p, i) => ({ x: i, y: p.avgRetention }));
    const { slope, intercept } = computeTrendLine(trendPoints);

    // Attach trend + weekly avg to points
    for (let i = 0; i < points.length; i++) {
      points[i].trend = Math.round(slope * i + intercept);
      points[i].weeklyAvg = weekAvgs[points[i].weekKey];
    }

    const totalAvg =
      points.length > 0
        ? Math.round(points.reduce((a, p) => a + p.avgRetention, 0) / points.length)
        : 0;

    return { data: points, avg: totalAvg, prValue: maxRetention, maxRounds: maxR };
  }, [sessions]);

  if (sessions.length < 2) return null;

  const roundColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          {strings.progress.chart.title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("avg")}
            aria-pressed={mode === "avg"}
            aria-label="Show average retention"
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
              mode === "avg"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {strings.progress.chart.showAvg}
          </button>
          <button
            onClick={() => setMode("rounds")}
            aria-pressed={mode === "rounds"}
            aria-label="Show per-round breakdown"
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
              mode === "rounds"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {strings.progress.chart.showRounds}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {mode === "avg" ? (
          <>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-3 bg-blue-400" /> {strings.progress.chart.avgLegend}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-3 bg-green-400" style={{ borderTop: "2px dashed #4ade80" }} /> {strings.progress.chart.trendLegend}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-3 bg-orange-400" style={{ borderTop: "2px dotted #fb923c" }} /> {strings.progress.chart.weeklyAvgLegend}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" /> {strings.progress.chart.prLegend}
            </span>
          </>
        ) : (
          Array.from({ length: maxRounds }, (_, i) => (
            <span key={i} className="flex items-center gap-1">
              <span
                className="inline-block h-0.5 w-3"
                style={{ backgroundColor: roundColors[i % roundColors.length] }}
              />
              R{i + 1}
            </span>
          ))
        )}
      </div>

      <div className="sr-only">
        Retention chart showing {data.length} sessions. Overall average: {avg} seconds. Personal record: {prValue} seconds.
        {mode === "rounds"
          ? ` Showing per-round breakdown for up to ${maxRounds} rounds.`
          : ` Showing average retention with trend line and weekly averages.`}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} role="img" aria-label={`Retention chart: ${data.length} sessions, average ${avg}s, PR ${prValue}s`}>
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
            formatter={(value: number, name: string) => {
              const label = name === "avgRetention"
                ? strings.progress.chart.tooltipLabel
                : name === "trend"
                ? strings.progress.chart.trendLegend
                : name === "weeklyAvg"
                ? strings.progress.chart.weeklyAvgLegend
                : name;
              return [`${value}s`, label];
            }}
          />

          {mode === "avg" ? (
            <>
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
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#4ade80"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                activeDot={false}
              />
              <Line
                type="stepAfter"
                dataKey="weeklyAvg"
                stroke="#fb923c"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
                activeDot={false}
              />
            </>
          ) : (
            Array.from({ length: maxRounds }, (_, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={(d: ChartPoint) => d.rounds[i] ?? null}
                name={strings.progress.chart.roundTooltipLabel(i + 1)}
                stroke={roundColors[i % roundColors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls
              />
            ))
          )}
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
              <span className="text-lg" aria-label={`Feeling rating: ${s.feelingRating} out of 5`}>
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

export default function BreathingHistory({ sessions }: { sessions: BreathingSession[] }) {
  return (
    <div className="flex flex-col gap-4">
      <RetentionChart sessions={sessions} />
      <BreathingList sessions={sessions} />
    </div>
  );
}
