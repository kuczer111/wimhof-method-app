"use client";

import { useEffect, useRef, useState } from "react";

interface RetentionHoldProps {
  onComplete: (durationMs: number) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}`;
}

export default function RetentionHold({ onComplete }: RetentionHoldProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 200);
    return () => clearInterval(id);
  }, []);

  const handleTap = () => {
    const duration = Date.now() - startTimeRef.current;
    onComplete(duration);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 pt-12 pb-24">
      <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
        Retention Hold
      </p>

      <p className="text-center text-sm text-gray-500">
        Exhale and hold your breath
      </p>

      <span className="text-8xl font-bold tabular-nums text-gray-50">
        {formatTime(elapsedMs)}
      </span>

      <button
        type="button"
        onClick={handleTap}
        className="mt-4 rounded-full bg-sky-500 px-10 py-4 text-lg font-semibold text-white transition-colors active:bg-sky-600"
      >
        I breathed
      </button>
    </div>
  );
}
