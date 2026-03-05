"use client";

import { useEffect, useRef, useState } from "react";
import { playHoldStartChime, playHoldEndChime } from "@/lib/audio";
import { formatTimeMs } from "@/lib/format";
import { strings } from "@/lib/i18n";

interface RetentionHoldProps {
  onComplete: (durationMs: number) => void;
  mindsetPrompt?: string;
  retentionMode?: "free" | "target";
  personalBestMs?: number;
}

export default function RetentionHold({
  onComplete,
  mindsetPrompt,
  retentionMode = "free",
  personalBestMs,
}: RetentionHoldProps) {
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

  // PB approach indicator for target mode
  const showPbIndicator = retentionMode === "target" && personalBestMs != null;
  const pbProgress = showPbIndicator ? Math.min(elapsedMs / personalBestMs, 1) : 0;
  const isPastPb = showPbIndicator && elapsedMs >= personalBestMs;
  const isApproaching = showPbIndicator && pbProgress >= 0.8 && !isPastPb;

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 pt-12 pb-24">
      <p className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {strings.breathing.retention.label}
      </p>

      {mindsetPrompt && (
        <p className="max-w-xs text-center text-base font-medium italic text-sky-600 dark:text-sky-400">
          &ldquo;{mindsetPrompt}&rdquo;
        </p>
      )}

      <p className="text-center text-sm text-gray-500">
        {strings.breathing.retention.instruction}
      </p>

      <span
        className={`text-8xl font-bold tabular-nums transition-colors ${
          isPastPb
            ? "text-amber-500 dark:text-amber-400"
            : isApproaching
              ? "text-sky-500 dark:text-sky-400"
              : "text-gray-900 dark:text-gray-50"
        }`}
      >
        {formatTimeMs(elapsedMs)}
      </span>

      {showPbIndicator && (
        <div className="w-full max-w-xs">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              {strings.breathing.retention.pbTarget(formatTimeMs(personalBestMs))}
            </span>
            <span
              className={`font-semibold ${
                isPastPb
                  ? "text-amber-500"
                  : isApproaching
                    ? "text-sky-500"
                    : "text-gray-400"
              }`}
            >
              {isPastPb
                ? strings.breathing.retention.newPb
                : isApproaching
                  ? strings.breathing.retention.approachingPb
                  : ""}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isPastPb
                  ? "bg-amber-500"
                  : isApproaching
                    ? "bg-sky-500"
                    : "bg-gray-400 dark:bg-gray-500"
              }`}
              style={{ width: `${Math.min(pbProgress * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleTap}
        className="mt-4 rounded-full bg-sky-500 px-10 py-4 text-lg font-semibold text-white transition-colors active:bg-sky-600"
      >
        {strings.breathing.retention.tapButton}
      </button>
    </div>
  );
}
