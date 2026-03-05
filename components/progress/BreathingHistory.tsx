import { useMemo } from "react";
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

export default function BreathingHistory({ sessions }: { sessions: BreathingSession[] }) {
  return (
    <div className="flex flex-col gap-4">
      <RetentionChart sessions={sessions} />
      <BreathingList sessions={sessions} />
    </div>
  );
}
