import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Dot } from "recharts";
import Card from "@/components/ui/Card";
import type { BreathingSession } from "@/lib/storage";
import { strings } from "@/lib/i18n";
import { buildChartData, type ChartPoint } from "./retentionData";

function PRDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  const { cx, cy, payload } = props;
  if (!payload?.isPR) return null;
  return <Dot cx={cx} cy={cy} r={6} fill="#facc15" stroke="#facc15" strokeWidth={2} />;
}

type ChartMode = "avg" | "rounds";
const roundColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

export default function RetentionChart({ sessions }: { sessions: BreathingSession[] }) {
  const [mode, setMode] = useState<ChartMode>("avg");
  const { data, avg, prValue, maxRounds } = useMemo(() => buildChartData(sessions), [sessions]);

  if (sessions.length < 2) return null;

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-on-surface-light-muted dark:text-on-surface-muted">{strings.progress.chart.title}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode("avg")} aria-pressed={mode === "avg"} aria-label="Show average retention" className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${mode === "avg" ? "bg-brand/10 text-brand-dark dark:bg-brand-dark/20 dark:text-brand-light" : "text-on-surface-muted hover:text-on-surface-faint dark:hover:text-on-surface"}`}>
            {strings.progress.chart.showAvg}
          </button>
          <button onClick={() => setMode("rounds")} aria-pressed={mode === "rounds"} aria-label="Show per-round breakdown" className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${mode === "rounds" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "text-on-surface-muted hover:text-on-surface-faint dark:hover:text-on-surface"}`}>
            {strings.progress.chart.showRounds}
          </button>
        </div>
      </div>

      <div className="mb-1 flex flex-wrap items-center gap-3 text-xs text-on-surface-light-muted">
        {mode === "avg" ? (
          <>
            <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-3 bg-blue-400" /> {strings.progress.chart.avgLegend}</span>
            <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-3 bg-green-400" style={{ borderTop: "2px dashed #4ade80" }} /> {strings.progress.chart.trendLegend}</span>
            <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-3 bg-orange-400" style={{ borderTop: "2px dotted #fb923c" }} /> {strings.progress.chart.weeklyAvgLegend}</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-yellow-400" /> {strings.progress.chart.prLegend}</span>
          </>
        ) : (
          Array.from({ length: maxRounds }, (_, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-3" style={{ backgroundColor: roundColors[i % roundColors.length] }} />
              R{i + 1}
            </span>
          ))
        )}
      </div>

      <div className="sr-only">
        Retention chart showing {data.length} sessions. Overall average: {avg} seconds. Personal record: {prValue} seconds.
        {mode === "rounds" ? ` Showing per-round breakdown for up to ${maxRounds} rounds.` : ` Showing average retention with trend line and weekly averages.`}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} role="img" aria-label={`Retention chart: ${data.length} sessions, average ${avg}s, PR ${prValue}s`}>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}s`} />
          <Tooltip
            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#9ca3af" }}
            formatter={(value: number, name: string) => {
              const label = name === "avgRetention" ? strings.progress.chart.tooltipLabel : name === "trend" ? strings.progress.chart.trendLegend : name === "weeklyAvg" ? strings.progress.chart.weeklyAvgLegend : name;
              return [`${value}s`, label];
            }}
          />
          {mode === "avg" ? (
            <>
              <ReferenceLine y={avg} stroke="#60a5fa" strokeDasharray="4 4" strokeWidth={1} />
              <Line type="monotone" dataKey="avgRetention" stroke="#3b82f6" strokeWidth={2} dot={<PRDot />} activeDot={{ r: 4, fill: "#3b82f6" }} />
              <Line type="monotone" dataKey="trend" stroke="#4ade80" strokeWidth={1.5} strokeDasharray="6 3" dot={false} activeDot={false} />
              <Line type="stepAfter" dataKey="weeklyAvg" stroke="#fb923c" strokeWidth={1.5} strokeDasharray="2 2" dot={false} activeDot={false} />
            </>
          ) : (
            Array.from({ length: maxRounds }, (_, i) => (
              <Line key={i} type="monotone" dataKey={(d: ChartPoint) => d.rounds[i] ?? null} name={strings.progress.chart.roundTooltipLabel(i + 1)} stroke={roundColors[i % roundColors.length]} strokeWidth={2} dot={false} activeDot={{ r: 3 }} connectNulls />
            ))
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-1 flex justify-between text-xs text-on-surface-light-muted">
        <span>{strings.progress.chart.overallAvg(avg)}</span>
        <span>{strings.progress.chart.pr(prValue)}</span>
      </div>
    </Card>
  );
}
