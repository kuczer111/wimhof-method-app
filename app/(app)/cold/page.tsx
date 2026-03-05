"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { saveColdSession, generateId, type ColdSession } from "@/lib/storage";
import { formatTime } from "@/lib/format";

const DURATION_OPTIONS = [30, 60, 90, 120, 180];
const COLD_TYPES: ColdSession["type"][] = ["shower", "bath", "outdoor", "other"];
const FEELING_LABELS = ["Rough", "Meh", "OK", "Good", "Great"];

function formatLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = seconds / 60;
  return Number.isInteger(m) ? `${m}min` : `${m.toFixed(1)}min`;
}

function CircularProgress({
  elapsed,
  target,
  radius = 110,
  stroke = 10,
}: {
  elapsed: number;
  target: number;
  radius?: number;
  stroke?: number;
}) {
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = Math.min(elapsed / target, 1);
  const offset = circumference * (1 - progress);
  const exceeded = elapsed > target;

  return (
    <svg
      width={radius * 2}
      height={radius * 2}
      className="mx-auto -rotate-90"
    >
      {/* Background ring */}
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-gray-200 dark:text-gray-800"
      />
      {/* Progress ring */}
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={`transition-[stroke-dashoffset] duration-300 ${
          exceeded ? "text-emerald-400" : "text-cyan-400"
        }`}
      />
    </svg>
  );
}

export default function ColdPage() {
  const [target, setTarget] = useState(60);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const alertedRef = useRef(false);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setFinished(true);
  }, []);

  const start = useCallback(() => {
    setElapsed(0);
    setFinished(false);
    setRunning(true);
    alertedRef.current = false;
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const secs = Math.floor((now - startTimeRef.current) / 1000);
      setElapsed(secs);
    }, 250);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setFinished(false);
    setElapsed(0);
    alertedRef.current = false;
  }, []);

  // Vibrate when target reached
  useEffect(() => {
    if (running && elapsed >= target && !alertedRef.current) {
      alertedRef.current = true;
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    }
  }, [running, elapsed, target]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Log form state
  const [coldType, setColdType] = useState<ColdSession["type"]>("shower");
  const [temperature, setTemperature] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const session: ColdSession = {
      id: generateId(),
      date: new Date().toISOString(),
      duration: elapsed,
      targetDuration: target,
      type: coldType,
      ...(temperature.trim() && { temperature: Number(temperature) }),
      ...(rating !== null && { rating }),
    };
    saveColdSession(session);
    setSaved(true);
  }

  function handleDone() {
    if (!saved) handleSave();
    reset();
    setSaved(false);
    setTemperature("");
    setRating(null);
    setColdType("shower");
  }

  // Timer running view
  if (running) {
    const exceeded = elapsed > target;
    return (
      <div className="flex flex-col items-center gap-6 px-4 pt-8 pb-24">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Cold Shower</h1>

        <div className="relative">
          <CircularProgress elapsed={elapsed} target={target} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums text-gray-900 dark:text-gray-50">
              {formatTime(elapsed)}
            </span>
            <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {exceeded ? "Target reached!" : `Target: ${formatLabel(target)}`}
            </span>
          </div>
        </div>

        <Button size="lg" variant="danger" className="w-full max-w-xs" onClick={stop}>
          Stop
        </Button>
      </div>
    );
  }

  // Log form after timer ends
  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 px-4 pt-8 pb-24">
        <p className="text-sm font-medium uppercase tracking-wider text-cyan-400">
          Session Complete
        </p>
        <p className="text-4xl font-bold text-gray-900 dark:text-gray-50">{formatTime(elapsed)}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Target: {formatLabel(target)}
        </p>

        {/* Type selector */}
        <div className="w-full max-w-xs">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Type
          </h3>
          <div className="flex flex-wrap gap-2">
            {COLD_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setColdType(t)}
                className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  coldType === t
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-200 text-gray-600 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:active:bg-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Temperature (optional) */}
        <div className="w-full max-w-xs">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Water Temperature (optional)
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="e.g. 10"
              className="w-full rounded-xl border border-gray-300 bg-gray-100/60 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">°C</span>
          </div>
        </div>

        {/* Rating */}
        <div className="w-full max-w-xs">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            How did it feel?
          </h3>
          <div className="flex justify-center gap-2">
            {FEELING_LABELS.map((label, i) => {
              const value = i + 1;
              const isSelected = rating === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-cyan-500 text-white"
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

        {/* Actions */}
        <div className="flex w-full max-w-xs flex-col gap-3 pt-2">
          {!saved && (
            <Button size="lg" className="w-full bg-cyan-500 active:bg-cyan-600" onClick={handleSave}>
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

  // Config view
  return (
    <div className="flex flex-col gap-6 px-4 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Cold Shower</h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Target Duration
        </h2>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setTarget(d)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                target === d
                  ? "bg-cyan-500 text-white"
                  : "bg-gray-800 text-gray-300 active:bg-gray-700"
              }`}
            >
              {formatLabel(d)}
            </button>
          ))}
        </div>
      </Card>

      <Button size="lg" className="mt-2 w-full bg-cyan-500 active:bg-cyan-600" onClick={start}>
        Start Timer
      </Button>
    </div>
  );
}
