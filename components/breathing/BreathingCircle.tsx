"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Pace = "slow" | "medium" | "fast";

interface BreathingCircleProps {
  pace: Pace;
  isActive?: boolean;
}

const paceDurations: Record<Pace, number> = {
  slow: 2.5,
  medium: 2,
  fast: 1.5,
};

function BreathingProgressBar({ pace, isActive }: { pace: Pace; isActive: boolean }) {
  const duration = paceDurations[pace] * 1000;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }
    let animFrame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) % duration;
      setProgress(elapsed / duration);
      animFrame = requestAnimationFrame(tick);
    };
    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [isActive, duration]);

  return (
    <div className="flex items-center justify-center" role="img" aria-label="Breathing pace indicator">
      <div className="w-[min(12rem,45vw)]">
        <div
          role="progressbar"
          aria-label="Breathing cycle progress"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-3 w-full overflow-hidden rounded-full bg-brand-light/30 dark:bg-brand-dark/30"
        >
          <div
            className="h-full rounded-full bg-brand transition-none"
            style={{ width: `${(progress <= 0.5 ? progress * 2 : 2 - progress * 2) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-on-surface-light-muted dark:text-on-surface-muted">
          {progress <= 0.5 ? "Inhale" : "Exhale"}
        </p>
      </div>
    </div>
  );
}

export default function BreathingCircle({
  pace,
  isActive = true,
}: BreathingCircleProps) {
  const reducedMotion = useReducedMotion();
  const duration = paceDurations[pace];

  if (reducedMotion) {
    return <BreathingProgressBar pace={pace} isActive={isActive} />;
  }

  return (
    <div className="flex items-center justify-center" role="img" aria-label="Breathing animation guide">
      <div
        aria-hidden="true"
        className="rounded-full bg-brand/30 flex items-center justify-center"
        style={{
          width: "min(200px, 45vw)",
          height: "min(200px, 45vw)",
          animation: isActive
            ? `breathe ${duration}s ease-in-out infinite`
            : "none",
          transform: isActive ? undefined : "scale(1)",
          opacity: isActive ? undefined : 0.4,
        }}
      >
        <div className="w-[min(4rem,18vw)] h-[min(4rem,18vw)] rounded-full bg-brand-light" />
      </div>
    </div>
  );
}
