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
      <p className="text-sm font-medium uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
        {strings.breathing.retention.label}
      </p>

      {mindsetPrompt && (
        <p className="max-w-xs text-center text-base font-medium italic text-brand-dark dark:text-brand-light">
          &ldquo;{mindsetPrompt}&rdquo;
        </p>
      )}

      <p className="text-center text-sm text-on-surface-light-muted">
        {strings.breathing.retention.instruction}
      </p>

      <span
        role="timer"
        aria-label="Retention hold time"
        aria-live="off"
        className={`text-8xl font-bold tabular-nums transition-colors ${
          isPastPb
            ? "text-warning dark:text-warning-light"
            : isApproaching
              ? "text-brand dark:text-brand-light"
              : "text-on-surface-light dark:text-on-surface"
        }`}
      >
        {formatTimeMs(elapsedMs)}
      </span>

      {showPbIndicator && (
        <div className="w-full max-w-xs">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-on-surface-light-muted dark:text-on-surface-muted">
              {strings.breathing.retention.pbTarget(formatTimeMs(personalBestMs))}
            </span>
            <span
              className={`font-semibold ${
                isPastPb
                  ? "text-warning"
                  : isApproaching
                    ? "text-brand"
                    : "text-on-surface-muted"
              }`}
            >
              {isPastPb
                ? strings.breathing.retention.newPb
                : isApproaching
                  ? strings.breathing.retention.approachingPb
                  : ""}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Personal best progress"
            aria-valuenow={Math.round(pbProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 w-full overflow-hidden rounded-full bg-on-surface-light/10 dark:bg-on-surface-faint"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isPastPb
                  ? "bg-warning"
                  : isApproaching
                    ? "bg-brand"
                    : "bg-on-surface-muted dark:bg-on-surface-muted"
              }`}
              style={{ width: `${Math.min(pbProgress * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleTap}
        aria-label="End breath hold"
        className="mt-4 rounded-full bg-brand px-10 py-4 text-lg font-semibold text-white transition-colors active:bg-brand-dark"
      >
        {strings.breathing.retention.tapButton}
      </button>
    </div>
  );
}
