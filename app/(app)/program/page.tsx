"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SessionRunner from "@/components/breathing/SessionRunner";
import ColdTimer from "@/components/cold/ColdTimer";
import { strings } from "@/lib/i18n";
import {
  getProgramProgress,
  saveProgramProgress,
  deleteProgramProgress,
} from "@/lib/storage";
import type { ProgramProgress } from "@/lib/program";
import { BEGINNER_PROGRAM, type ProgramDay } from "@/lib/program";

type PageView = "overview" | "breathing" | "cold";

export default function ProgramPage() {
  const [progress, setProgress] = useState<ProgramProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<PageView>("overview");
  const [confirmReset, setConfirmReset] = useState(false);

  const program = BEGINNER_PROGRAM;

  const loadProgress = useCallback(async () => {
    const p = await getProgramProgress(program.id);
    setProgress(p ?? null);
    setLoading(false);
  }, [program.id]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // --- Derived state ---

  const todayDayNumber = progress
    ? getTodayDayNumber(progress)
    : null;

  const todayProgramDay = todayDayNumber
    ? program.days.find((d) => d.dayNumber === todayDayNumber)
    : null;

  const isTodayCompleted = progress && todayDayNumber
    ? progress.completedDays.includes(todayDayNumber)
    : false;

  const isProgramComplete = progress
    ? progress.completedDays.length >= program.days.filter((d) => !d.isRestDay).length
    : false;

  // --- Handlers ---

  async function handleStartProgram() {
    const newProgress: ProgramProgress = {
      programId: program.id,
      startDate: new Date().toISOString().split("T")[0],
      completedDays: [],
      paused: false,
    };
    await saveProgramProgress(newProgress);
    setProgress(newProgress);
  }

  async function handlePause() {
    if (!progress) return;
    const updated: ProgramProgress = {
      ...progress,
      paused: true,
      pausedDate: new Date().toISOString().split("T")[0],
    };
    await saveProgramProgress(updated);
    setProgress(updated);
  }

  async function handleResume() {
    if (!progress) return;
    // Shift start date forward by pause duration
    const pausedDate = progress.pausedDate
      ? new Date(progress.pausedDate)
      : new Date();
    const today = new Date();
    const pausedDays = Math.floor(
      (today.getTime() - pausedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const oldStart = new Date(progress.startDate);
    oldStart.setDate(oldStart.getDate() + pausedDays);
    const updated: ProgramProgress = {
      ...progress,
      startDate: oldStart.toISOString().split("T")[0],
      paused: false,
      pausedDate: undefined,
    };
    await saveProgramProgress(updated);
    setProgress(updated);
  }

  async function handleCompleteDay() {
    if (!progress || !todayDayNumber) return;
    if (progress.completedDays.includes(todayDayNumber)) return;
    const updated: ProgramProgress = {
      ...progress,
      completedDays: [...progress.completedDays, todayDayNumber],
    };
    await saveProgramProgress(updated);
    setProgress(updated);
  }

  async function handleReset() {
    await deleteProgramProgress(program.id);
    setProgress(null);
    setConfirmReset(false);
  }

  function handleSessionFinish() {
    handleCompleteDay();
    setView("overview");
  }

  function handleAutoCold() {
    handleCompleteDay();
    setView("cold");
  }

  // --- Session views ---

  if (view === "breathing" && todayProgramDay?.breathingConfig) {
    return (
      <SessionRunner
        config={todayProgramDay.breathingConfig}
        onFinish={handleSessionFinish}
        onAutoCold={handleAutoCold}
      />
    );
  }

  if (view === "cold") {
    const target = todayProgramDay?.coldTarget ?? 60;
    return (
      <ColdTimer
        target={target}
        onDone={() => setView("overview")}
      />
    );
  }

  // --- Loading ---

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  // --- Not started ---

  if (!progress) {
    return (
      <div className="flex flex-col items-center gap-6 px-4 pt-8 pb-24">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
          {strings.program.heading}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {program.description}
        </p>
        <p className="text-center text-gray-600 dark:text-gray-300">
          {strings.program.notStarted}
        </p>
        <Button size="lg" className="w-full max-w-xs" onClick={handleStartProgram}>
          {strings.program.startProgram}
        </Button>
      </div>
    );
  }

  // --- Program Complete ---

  if (isProgramComplete) {
    return (
      <div className="flex flex-col items-center gap-6 px-4 pt-8 pb-24">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
          {strings.program.programComplete}
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400">
          {strings.program.programCompleteMessage}
        </p>
        <CalendarView program={program} progress={progress} todayDayNumber={todayDayNumber} />
        <Button size="md" variant="secondary" onClick={() => setConfirmReset(true)}>
          {strings.program.resetProgram}
        </Button>
        {confirmReset && (
          <div className="flex gap-3">
            <Button size="sm" variant="danger" onClick={handleReset}>
              {strings.program.resetConfirm}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }

  // --- Active Program ---

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
            {strings.program.heading}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {strings.program.subtitle}
          </p>
        </div>
        {progress.paused && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {strings.program.paused}
          </span>
        )}
      </div>

      {/* Today's session card */}
      {todayProgramDay && !progress.paused && (
        <TodayCard
          day={todayProgramDay}
          isCompleted={isTodayCompleted}
          onStart={() => {
            if (todayProgramDay.breathingConfig) {
              setView("breathing");
            } else if (todayProgramDay.coldTarget) {
              setView("cold");
            } else {
              // Rest day — mark complete
              handleCompleteDay();
            }
          }}
        />
      )}

      {/* Calendar */}
      <CalendarView program={program} progress={progress} todayDayNumber={todayDayNumber} />

      {/* Pause/Resume controls */}
      <div className="flex flex-col items-center gap-3 pt-2">
        {progress.paused ? (
          <Button size="md" className="w-full max-w-xs" onClick={handleResume}>
            {strings.program.resume}
          </Button>
        ) : (
          <Button size="md" variant="secondary" className="w-full max-w-xs" onClick={handlePause}>
            {strings.program.pause}
          </Button>
        )}
        <button
          type="button"
          className="text-xs text-gray-400 underline dark:text-gray-500"
          onClick={() => setConfirmReset(true)}
        >
          {strings.program.resetProgram}
        </button>
        {confirmReset && (
          <div className="flex gap-3">
            <Button size="sm" variant="danger" onClick={handleReset}>
              {strings.program.resetConfirm}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helper: compute today's day number ---

function getTodayDayNumber(progress: ProgramProgress): number {
  const start = new Date(progress.startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  // Day 1 is the start date
  return Math.max(1, Math.min(diffDays + 1, 30));
}

// --- Today's Session Card ---

function TodayCard({
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

// --- Calendar View ---

function CalendarView({
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
