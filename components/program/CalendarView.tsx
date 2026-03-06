import { strings } from "@/lib/i18n";
import type { ProgramProgress } from "@/lib/program";
import { BEGINNER_PROGRAM } from "@/lib/program";

export default function CalendarView({
  program,
  progress,
  todayDayNumber,
}: {
  program: typeof BEGINNER_PROGRAM;
  progress: ProgramProgress;
  todayDayNumber: number | null;
}) {
  const weeks = [
    { label: strings.program.week(1), days: program.days.filter((d) => d.dayNumber <= 7) },
    { label: strings.program.week(2), days: program.days.filter((d) => d.dayNumber >= 8 && d.dayNumber <= 14) },
    { label: strings.program.week(3), days: program.days.filter((d) => d.dayNumber >= 15 && d.dayNumber <= 21) },
    { label: strings.program.week(4), days: program.days.filter((d) => d.dayNumber >= 22) },
  ];

  return (
    <div className="flex flex-col gap-3">
      {weeks.map((week) => (
        <div key={week.label}>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {week.label}
          </h3>
          <div className="flex gap-1.5">
            {week.days.map((day) => {
              const isCompleted = progress.completedDays.includes(day.dayNumber);
              const isToday = day.dayNumber === todayDayNumber;
              const isFuture = todayDayNumber !== null && day.dayNumber > todayDayNumber;

              let bg = "bg-gray-200 dark:bg-gray-800";
              let text = "text-gray-500 dark:text-gray-400";

              if (isCompleted) {
                bg = "bg-emerald-500 dark:bg-emerald-600";
                text = "text-white";
              } else if (isToday) {
                bg = "bg-sky-500 dark:bg-sky-600";
                text = "text-white";
              } else if (day.isRestDay) {
                bg = "bg-gray-100 dark:bg-gray-800/50";
                text = "text-gray-400 dark:text-gray-500";
              } else if (isFuture) {
                bg = "bg-gray-100 dark:bg-gray-800/50";
                text = "text-gray-400 dark:text-gray-600";
              }

              return (
                <div
                  key={day.dayNumber}
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-medium ${bg} ${text}`}
                  title={day.label}
                >
                  {isCompleted ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    day.dayNumber
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
