"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import {
  saveBreathingSession,
  getBreathingSessions,
  generateId,
  type BreathingSession,
} from "@/lib/storage";

type Pace = "slow" | "medium" | "fast";

interface SessionCompleteProps {
  rounds: number;
  breathsPerRound: number;
  pace: Pace;
  retentionTimes: number[]; // ms per round
  totalDurationMs: number;
  onDone: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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

const FEELING_LABELS = ["Rough", "Meh", "OK", "Good", "Great"];

export default function SessionComplete({
  rounds,
  breathsPerRound,
  pace,
  retentionTimes,
  totalDurationMs,
  onDone,
}: SessionCompleteProps) {
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
    const session: BreathingSession = {
      id: generateId(),
      date: new Date().toISOString(),
      rounds,
      retentionTimes: retentionTimesSeconds,
      totalDuration: Math.round(totalDurationMs / 1000),
      breathsPerRound,
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
      <p className="text-sm font-medium uppercase tracking-wider text-emerald-400">
        Session Complete
      </p>
      <p className="text-4xl font-bold text-gray-50">Well done!</p>

      {/* Summary stats */}
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-2xl font-bold tabular-nums text-gray-50">
            {formatDuration(totalDurationMs)}
          </p>
          <p className="text-xs text-gray-400">Total Time</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-gray-50">
            {rounds}
          </p>
          <p className="text-xs text-gray-400">
            Round{rounds > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Retention times */}
      {retentionTimes.length > 0 && (
        <div className="w-full max-w-xs rounded-2xl bg-gray-800/60 p-4">
          <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
            Retention Times
          </h3>
          <ul className="flex flex-col gap-2">
            {retentionTimes.map((ms, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Round {i + 1}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono font-semibold tabular-nums text-gray-50">
                    {formatDuration(ms)}
                  </span>
                  {newPersonalBests.has(i) && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                      PB
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feeling scale */}
      <div className="w-full max-w-xs">
        <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
          How do you feel?
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
                    : "bg-gray-800 text-gray-400 active:bg-gray-700"
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
          placeholder="Add a note (optional)..."
          rows={2}
          className="w-full resize-none rounded-xl border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>

      {/* Actions */}
      <div className="flex w-full max-w-xs flex-col gap-3 pt-2">
        {!saved && (
          <Button size="lg" className="w-full" onClick={handleSave}>
            Save Session
          </Button>
        )}
        <Button
          size="lg"
          variant={saved ? "primary" : "secondary"}
          className="w-full"
          onClick={handleDone}
        >
          {saved ? "Done" : "Skip & Finish"}
        </Button>
      </div>
    </div>
  );
}
