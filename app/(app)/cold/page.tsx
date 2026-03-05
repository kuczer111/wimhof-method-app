"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const DURATION_OPTIONS = [30, 60, 90, 120, 180];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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
        className="text-gray-800"
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

  // Timer running or finished view
  if (running || finished) {
    const exceeded = elapsed > target;
    return (
      <div className="flex flex-col items-center gap-6 px-4 pt-8 pb-24">
        <h1 className="text-xl font-bold text-gray-50">Cold Shower</h1>

        <div className="relative">
          <CircularProgress elapsed={elapsed} target={target} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums text-gray-50">
              {formatTime(elapsed)}
            </span>
            <span className="mt-1 text-sm text-gray-400">
              {exceeded ? "Target reached!" : `Target: ${formatLabel(target)}`}
            </span>
          </div>
        </div>

        {running ? (
          <Button size="lg" variant="danger" className="w-full max-w-xs" onClick={stop}>
            Stop
          </Button>
        ) : (
          <div className="flex w-full max-w-xs flex-col gap-3">
            <p className="text-center text-lg font-semibold text-gray-50">
              {elapsed >= target ? "Great job!" : `${formatTime(elapsed)} / ${formatLabel(target)}`}
            </p>
            <Button size="lg" className="w-full" onClick={reset}>
              Done
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Config view
  return (
    <div className="flex flex-col gap-6 px-4 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-50">Cold Shower</h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
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
