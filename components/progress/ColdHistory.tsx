import { useMemo } from 'react';
import Card from '@/components/ui/Card';
import { getPreferences, type ColdSession } from '@/lib/storage';
import {
  formatDuration,
  displayTemperature,
  getTemperatureUnitLabel,
} from '@/lib/format';
import { strings } from '@/lib/i18n';
import { calculateStreak } from '@/lib/analytics';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ColdStats({ sessions }: { sessions: ColdSession[] }) {
  const { totalMinutes, streak, calendarDays } = useMemo(() => {
    const totalSec = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalMin =
      totalSec > 0 && totalSec < 60 ? '< 1' : Math.round(totalSec / 60);

    const sessionDates = new Set(
      sessions.map((s) => toLocalDateString(new Date(s.date))),
    );

    const streakCount = calculateStreak(sessions);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: { date: string; hasSession: boolean }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toLocalDateString(d);
      days.push({ date: key, hasSession: sessionDates.has(key) });
    }

    return { totalMinutes: totalMin, streak: streakCount, calendarDays: days };
  }, [sessions]);

  if (sessions.length === 0) return null;

  const weeks: (typeof calendarDays)[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-on-surface-light-muted dark:text-on-surface-muted">
        {strings.progress.coldStats.title}
      </h3>
      <div className="mb-4 flex gap-4">
        <div className="flex-1 rounded-lg bg-on-surface-light/[0.06] p-3 text-center dark:bg-surface-raised">
          <p className="text-2xl font-bold text-cold-light">{totalMinutes}</p>
          <p className="text-xs text-on-surface-light-muted">
            {strings.progress.coldStats.totalMinutes}
          </p>
        </div>
        <div className="flex-1 rounded-lg bg-on-surface-light/[0.06] p-3 text-center dark:bg-surface-raised">
          <p className="text-2xl font-bold text-cold-light">{streak}</p>
          <p className="text-xs text-on-surface-light-muted">
            {strings.progress.coldStats.dayStreak}
          </p>
        </div>
      </div>
      <p className="mb-2 text-xs text-on-surface-light-muted">
        {strings.progress.coldStats.last12Weeks}
      </p>
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                title={day.date}
                className={`h-3 w-3 rounded-sm ${
                  day.hasSession
                    ? 'bg-cold'
                    : 'bg-on-surface-light/10 dark:bg-surface-overlay'
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
      <p className="mt-8 text-center text-on-surface-light-muted">
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
              <p className="text-sm text-on-surface-light-muted dark:text-on-surface-muted">
                {formatDate(s.date)}
              </p>
              <p className="mt-1 font-semibold">{formatDuration(s.duration)}</p>
            </div>
            <span className="rounded-full bg-cold/10 px-2 py-0.5 text-xs capitalize text-cold-dark dark:bg-cold-dark/20 dark:text-cold-light">
              {s.type}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-on-surface-light-muted">
            <span>
              {strings.progress.coldTarget(formatDuration(s.targetDuration))}
            </span>
            {s.temperature != null && (
              <span>
                {displayTemperature(
                  s.temperature,
                  getPreferences().temperatureUnit,
                )}
                {getTemperatureUnitLabel(getPreferences().temperatureUnit)}
              </span>
            )}
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
