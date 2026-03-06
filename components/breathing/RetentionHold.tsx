"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playHoldStartChime, playHoldEndChime } from "@/lib/audio";
import { formatTimeMs } from "@/lib/format";
import { strings } from "@/lib/i18n";

const LONG_PRESS_MS = 500;
const DOUBLE_TAP_MS = 400;
const CIRCLE_RADIUS = 22;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

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

  // --- Long-press & double-tap state ---
  const [pressing, setPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const pressStartRef = useRef<number | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressRafRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  const completedRef = useRef(false);
  const pointerActiveRef = useRef(false);

  const completeHold = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    playHoldEndChime();
    const duration = Date.now() - startTimeRef.current;
    onComplete(duration);
  }, [onComplete]);

  const cancelPress = useCallback(() => {
    setPressing(false);
    setPressProgress(0);
    pressStartRef.current = null;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (pressRafRef.current) {
      cancelAnimationFrame(pressRafRef.current);
      pressRafRef.current = null;
    }
  }, []);

  const animateProgress = useCallback(() => {
    if (pressStartRef.current == null) return;
    const elapsed = Date.now() - pressStartRef.current;
    const progress = Math.min(elapsed / LONG_PRESS_MS, 1);
    setPressProgress(progress);
    if (progress < 1) {
      pressRafRef.current = requestAnimationFrame(animateProgress);
    }
  }, []);

  const handlePointerDown = useCallback(() => {
    if (completedRef.current) return;
    pointerActiveRef.current = true;
    setPressing(true);
    pressStartRef.current = Date.now();
    pressRafRef.current = requestAnimationFrame(animateProgress);
    pressTimerRef.current = setTimeout(() => {
      setPressProgress(1);
      completeHold();
    }, LONG_PRESS_MS);
  }, [animateProgress, completeHold]);

  const handlePointerUp = useCallback(() => {
    if (!pressing) return;
    cancelPress();
    // Check double-tap
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      completeHold();
    }
    lastTapRef.current = now;
  }, [pressing, cancelPress, completeHold]);

  const handlePointerLeave = useCallback(() => {
    if (pressing) cancelPress();
  }, [pressing, cancelPress]);

  // Screen reader / keyboard click – only fires if no pointer interaction preceded it
  const handleClick = useCallback(() => {
    if (pointerActiveRef.current) {
      pointerActiveRef.current = false;
      return;
    }
    completeHold();
  }, [completeHold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (pressRafRef.current) cancelAnimationFrame(pressRafRef.current);
    };
  }, []);

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
              className={`h-full rounded-full transition-all duration-normal ${
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
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        onClick={handleClick}
        aria-label="End breath hold. Hold for half a second or double-tap to end."
        className="relative mt-4 select-none touch-none rounded-full bg-brand px-10 py-4 text-lg font-semibold text-white transition-colors active:bg-brand-dark"
      >
        {strings.breathing.retention.tapButton}
        {pressing && (
          <svg
            className="pointer-events-none absolute inset-0 -rotate-90"
            width="100%"
            height="100%"
            viewBox="0 0 52 52"
            aria-hidden="true"
          >
            <circle
              cx="26"
              cy="26"
              r={CIRCLE_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="3"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - pressProgress)}
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
