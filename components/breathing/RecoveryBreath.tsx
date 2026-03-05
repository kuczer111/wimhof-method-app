"use client";

import { useEffect, useRef, useState } from "react";
import { playCountdownBeep, playCountdownFinalBeep } from "@/lib/audio";

const RECOVERY_DURATION_S = 15;

interface RecoveryBreathProps {
  onComplete: () => void;
}

export default function RecoveryBreath({ onComplete }: RecoveryBreathProps) {
  const [remaining, setRemaining] = useState(RECOVERY_DURATION_S);
  const completedRef = useRef(false);
  const lastBeepRef = useRef<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const left = RECOVERY_DURATION_S - elapsed;
      if (left <= 0) {
        clearInterval(id);
        setRemaining(0);
        if (!completedRef.current) {
          completedRef.current = true;
          playCountdownFinalBeep();
          setTimeout(onComplete, 0);
        }
      } else {
        setRemaining(left);
        // Play countdown beeps for last 3 seconds
        if (left <= 3 && lastBeepRef.current !== left) {
          lastBeepRef.current = left;
          playCountdownBeep();
        }
      }
    }, 200);
    return () => clearInterval(id);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 pt-12 pb-24">
      <p className="text-sm font-medium uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
        Recovery Breath
      </p>

      <p className="text-center text-sm text-emerald-600/70 dark:text-emerald-300/70">
        Take a deep breath in and hold
      </p>

      <span className="text-8xl font-bold tabular-nums text-emerald-500 dark:text-emerald-300">
        {remaining}
      </span>

      <div className="h-2 w-48 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all duration-200 ease-linear"
          style={{
            width: `${(remaining / RECOVERY_DURATION_S) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
