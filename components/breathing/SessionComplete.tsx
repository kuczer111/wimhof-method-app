"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import {
  saveBreathingSession,
  savePreferences,
  getBreathingSessions,
  generateId,
  type BreathingSession,
  type SessionConfig,
} from "@/lib/storage";
import { formatTimeMs } from "@/lib/format";
import { strings } from "@/lib/i18n";

interface SessionCompleteProps {
  config: SessionConfig;
  retentionTimes: number[]; // ms per round
  totalDurationMs: number;
  onDone: () => void;
  isFirstSession?: boolean;
}

function getPersonalBests(): Map<number, number> {
  const sessions = getBreathingSessions();
  const bests = new Map<number, number>();
  for (const s of sessions) {
    for (let i = 0; i < s.retentionTimes.length; i++) {
      const roundIndex = i;
      const timeSeconds = s.retentionTimes[roundIndex];
      const current = bests.get(roundIndex);
      if (current === undefined || timeSeconds > current) {
        bests.set(roundIndex, timeSeconds);
      }
    }
  }
  return bests;
}

const FEELING_LABELS = strings.common.feelingLabels;

export default function SessionComplete({
  config,
  retentionTimes,
  totalDurationMs,
  onDone,
  isFirstSession = false,
}: SessionCompleteProps) {
  const { rounds, breathsPerRound, pace } = config;
  const [feelingRating, setFeelingRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const previousBests = getPersonalBests();

  const retentionTimesSeconds = retentionTimes.map((ms) =>
    Math.round(ms / 1000)
  );

  const newPersonalBests = new Set<number>();
  for (let i = 0; i < retentionTimesSeconds.length; i++) {
    const prev = previousBests.get(i);
    if (prev === undefined || retentionTimesSeconds[i] > prev) {
      newPersonalBests.add(i);
    }
  }

  function handleSave() {
    if (isFirstSession) {
      savePreferences({ firstSessionComplete: true });
    }
    const session: BreathingSession = {
      id: generateId(),
      date: new Date().toISOString(),
      rounds,
      retentionTimes: retentionTimesSeconds,
      totalDuration: Math.round(totalDurationMs / 1000),
      breathsPerRound: breathsPerRound[0],
      pace,
      ...(feelingRating !== null && { feelingRating }),
      ...(note.trim() && { note: note.trim() }),
    };
    saveBreathingSession(session);
    setSaved(true);
  }

  function handleDone() {
    if (!saved) handleSave();
    onDone();
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-12 pb-24">
      <p className="text-sm font-medium uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
        {strings.breathing.sessionComplete.status}
      </p>
      <p className="text-4xl font-bold text-gray-900 dark:text-gray-50">{strings.breathing.sessionComplete.message}</p>

      {/* Summary stats */}
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-50">
            {formatTimeMs(totalDurationMs)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{strings.breathing.sessionComplete.totalTime}</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-50">
            {rounds}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {strings.breathing.sessionComplete.roundLabel(rounds)}
          </p>
        </div>
      </div>

      {/* Retention times */}
      {retentionTimes.length > 0 && (
        <div className="w-full max-w-xs rounded-2xl bg-gray-100 p-4 dark:bg-gray-800/60">
          <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {strings.breathing.sessionComplete.retentionTimes}
          </h3>
          <ul className="flex flex-col gap-2">
            {retentionTimes.map((ms, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{strings.breathing.sessionComplete.roundNumber(i + 1)}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                    {formatTimeMs(ms)}
                  </span>
                  {newPersonalBests.has(i) && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                      {strings.breathing.sessionComplete.personalBest}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Enhanced debrief for first session */}
      {isFirstSession && retentionTimes.length > 0 && (
        <div className="w-full max-w-xs rounded-2xl bg-sky-50 p-4 dark:bg-sky-900/20">
          <h3 className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            {strings.guidedMode.enhancedDebrief.title}
          </h3>
          <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {strings.guidedMode.enhancedDebrief.retentionExplanation}
          </p>
          <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {strings.guidedMode.enhancedDebrief.firstRoundNote(formatTimeMs(retentionTimes[0]))}
          </p>
          <p className="text-sm font-medium text-sky-700 dark:text-sky-300">
            {strings.guidedMode.enhancedDebrief.improvementTip}
          </p>
        </div>
      )}

      {/* Feeling scale */}
      <div className="w-full max-w-xs">
        <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {strings.breathing.sessionComplete.howDoYouFeel}
        </h3>
        <div className="flex justify-center gap-2">
          {FEELING_LABELS.map((label, i) => {
            const value = i + 1;
            const isSelected = feelingRating === value;
            return (
              <button
                key={value}
                onClick={() => setFeelingRating(value)}
                className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-sky-500 text-white"
                    : "bg-gray-200 text-gray-500 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:active:bg-gray-700"
                }`}
              >
                <span className="text-lg font-bold">{value}</span>
                <span className="text-[9px] leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional note */}
      <div className="w-full max-w-xs">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={strings.breathing.sessionComplete.notePlaceholder}
          rows={2}
          className="w-full resize-none rounded-xl border border-gray-300 bg-gray-100/60 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Actions */}
      <div className="flex w-full max-w-xs flex-col gap-3 pt-2">
        {!saved && (
          <Button size="lg" className="w-full" onClick={handleSave}>
            {strings.common.saveSession}
          </Button>
        )}
        <Button
          size="lg"
          variant={saved ? "primary" : "secondary"}
          className="w-full"
          onClick={handleDone}
        >
          {saved ? strings.common.done : strings.common.skipAndFinish}
        </Button>
      </div>
    </div>
  );
}
