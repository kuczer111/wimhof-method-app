"use client";

import { useEffect, useRef, useState } from "react";
import BreathingCircle from "./BreathingCircle";
import { playInhaleTone, playExhaleTone } from "@/lib/audio";

type Pace = "slow" | "medium" | "fast";

const paceDurations: Record<Pace, number> = {
  slow: 2.5,
  medium: 2,
  fast: 1.5,
};

interface PowerBreathsProps {
  breathCount: number;
  pace: Pace;
  onComplete: () => void;
}

export default function PowerBreaths({
  breathCount,
  pace,
  onComplete,
}: PowerBreathsProps) {
  const [currentBreath, setCurrentBreath] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const isInhaleRef = useRef(true);

  // Play inhale tone on mount (first breath starts with inhale)
  useEffect(() => {
    playInhaleTone();
  }, []);

  useEffect(() => {
    const halfCycleMs = (paceDurations[pace] * 1000) / 2;

    intervalRef.current = setInterval(() => {
      isInhaleRef.current = !isInhaleRef.current;

      if (isInhaleRef.current) {
        // Inhale starts — this means we completed one full breath cycle
        setCurrentBreath((prev) => {
          const next = prev + 1;
          if (next > breathCount) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (!completedRef.current) {
              completedRef.current = true;
              setTimeout(onComplete, 0);
            }
            return prev;
          }
          playInhaleTone();
          return next;
        });
      } else {
        // Exhale
        playExhaleTone();
      }
    }, halfCycleMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [breathCount, pace, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 pt-12 pb-24">
      <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
        Power Breaths
      </p>

      <BreathingCircle pace={pace} isActive />

      <div className="flex flex-col items-center gap-1">
        <span className="text-7xl font-bold tabular-nums text-gray-50">
          {currentBreath}
        </span>
        <span className="text-sm text-gray-400">
          of {breathCount}
        </span>
      </div>

      <p className="text-center text-sm text-gray-500">
        Breathe in deeply, let go
      </p>
    </div>
  );
}
