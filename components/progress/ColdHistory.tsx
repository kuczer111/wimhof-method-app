import { useMemo } from "react";
import Card from "@/components/ui/Card";
import type { ColdSession } from "@/lib/storage";
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

function ColdStats({ sessions }: { sessions: ColdSession[] }) {
  const { totalMinutes, streak, calendarDays } = useMemo(() => {
    const totalSec = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalMin = Math.round(totalSec / 60);

    const sessionDates = new Set(
      sessions.map((s) => new Date(s.date).toISOString().slice(0, 10))
    );

    let streakCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(today);

    if (!sessionDates.has(checkDate.toISOString().slice(0, 10))) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (sessionDates.has(checkDate.toISOString().slice(0, 10))) {
      streakCount++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

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

export default function ColdHistory({ sessions }: { sessions: ColdSession[] }) {
  return (
    <div className="flex flex-col gap-4">
      <ColdStats sessions={sessions} />
      <ColdList sessions={sessions} />
    </div>
  );
}
