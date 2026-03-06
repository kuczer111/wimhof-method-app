import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { strings } from "@/lib/i18n";
import type { ProgramDay } from "@/lib/program";

export default function TodayCard({
  day,
  isCompleted,
  onStart,
}: {
  day: ProgramDay;
  isCompleted: boolean;
  onStart: () => void;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-50">
          {strings.program.todaySession}
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {strings.program.dayLabel(day.dayNumber)}
        </span>
      </div>

      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {day.label}
      </p>

      {day.isRestDay ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {strings.program.restDay}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {day.breathingConfig && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {strings.program.breathingLabel(
                day.breathingConfig.rounds,
                day.breathingConfig.breathsPerRound[0]
              )}
            </p>
          )}
          {day.coldTarget && (
            <p className="text-sm text-cyan-600 dark:text-cyan-400">
              {strings.program.coldLabel(day.coldTarget)}
            </p>
          )}
        </div>
      )}

      {day.mindsetTask && (
        <p className="text-xs italic text-gray-500 dark:text-gray-400">
          {day.mindsetTask}
        </p>
      )}

      {isCompleted ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 dark:bg-emerald-900/20">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-500">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {strings.program.completed}
          </span>
        </div>
      ) : (
        <Button size="lg" className="w-full" onClick={onStart}>
          {day.isRestDay ? strings.program.completed : strings.program.startSession}
        </Button>
      )}
    </Card>
  );
}
