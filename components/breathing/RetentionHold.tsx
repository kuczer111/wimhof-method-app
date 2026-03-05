"use client";

import { useEffect, useRef, useState } from "react";
import { playHoldStartChime, playHoldEndChime } from "@/lib/audio";
import { formatTimeMs } from "@/lib/format";

interface RetentionHoldProps {
  onComplete: (durationMs: number) => void;
}

export default function RetentionHold({ onComplete }: RetentionHoldProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    playHoldStartChime();
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 200);
    return () => clearInterval(id);
  }, []);

  const handleTap = () => {
    playHoldEndChime();
    const duration = Date.now() - startTimeRef.current;
    onComplete(duration);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 pt-12 pb-24">
      <p className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Retention Hold
      </p>

      <p className="text-center text-sm text-gray-500">
        Exhale and hold your breath
      </p>

      <span className="text-8xl font-bold tabular-nums text-gray-900 dark:text-gray-50">
        {formatTimeMs(elapsedMs)}
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
