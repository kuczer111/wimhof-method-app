import dynamic from "next/dynamic";
import Card from "@/components/ui/Card";
import type { BreathingSession } from "@/lib/storage";
import { formatDuration } from "@/lib/format";
import { strings } from "@/lib/i18n";

const RetentionChart = dynamic(() => import("./RetentionChart"), {
  loading: () => (
    <div className="rounded-2xl bg-white p-4 dark:bg-gray-800">
      <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-[200px] animate-pulse rounded bg-gray-100 dark:bg-gray-700/50" />
    </div>
  ),
  ssr: false,
});

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
