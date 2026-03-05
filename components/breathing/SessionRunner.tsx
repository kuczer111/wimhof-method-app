"use client";

import { useCallback, useState } from "react";
import PowerBreaths from "./PowerBreaths";
import RetentionHold from "./RetentionHold";
import RecoveryBreath from "./RecoveryBreath";
import Button from "@/components/ui/Button";

type Pace = "slow" | "medium" | "fast";

export interface SessionConfig {
  rounds: number;
  breathsPerRound: number;
  pace: Pace;
}

type Phase = "power-breaths" | "retention" | "recovery" | "complete";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface SessionRunnerProps {
  config: SessionConfig;
  onFinish: () => void;
}

export default function SessionRunner({ config, onFinish }: SessionRunnerProps) {
  const [phase, setPhase] = useState<Phase>("power-breaths");
  const [currentRound, setCurrentRound] = useState(1);
  const [retentionTimes, setRetentionTimes] = useState<number[]>([]);

  const handlePowerBreathsComplete = useCallback(() => {
    setPhase("retention");
  }, []);

  const handleRetentionComplete = useCallback((durationMs: number) => {
    setRetentionTimes((prev) => [...prev, durationMs]);
    setPhase("recovery");
  }, []);

  const handleRecoveryComplete = useCallback(() => {
    if (currentRound < config.rounds) {
      setCurrentRound((r) => r + 1);
      setPhase("power-breaths");
    } else {
      setPhase("complete");
    }
  }, [currentRound, config.rounds]);

  if (phase === "power-breaths") {
    return (
      <div>
        <p className="pt-4 text-center text-xs font-medium text-gray-500">
          Round {currentRound} of {config.rounds}
        </p>
        <PowerBreaths
          breathCount={config.breathsPerRound}
          pace={config.pace}
          onComplete={handlePowerBreathsComplete}
        />
      </div>
    );
  }

  if (phase === "retention") {
    return (
      <div>
        <p className="pt-4 text-center text-xs font-medium text-gray-500">
          Round {currentRound} of {config.rounds}
        </p>
        <RetentionHold onComplete={handleRetentionComplete} />
      </div>
    );
  }

  if (phase === "recovery") {
    return (
      <div>
        <p className="pt-4 text-center text-xs font-medium text-gray-500">
          Round {currentRound} of {config.rounds}
        </p>
        <RecoveryBreath onComplete={handleRecoveryComplete} />
      </div>
    );
  }

  // complete
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 pt-12 pb-24">
      <p className="text-sm font-medium uppercase tracking-wider text-emerald-400">
        Session Complete
      </p>
      <p className="text-4xl font-bold text-gray-50">Well done!</p>
      <p className="text-sm text-gray-400">
        {config.rounds} round{config.rounds > 1 ? "s" : ""} completed
      </p>

      {retentionTimes.length > 0 && (
        <div className="w-full max-w-xs rounded-2xl bg-gray-800/60 p-4">
          <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
            Retention Times
          </h3>
          <ul className="flex flex-col gap-2">
            {retentionTimes.map((ms, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-400">Round {i + 1}</span>
                <span className="font-mono font-semibold tabular-nums text-gray-50">
                  {formatDuration(ms)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button size="lg" className="mt-4" onClick={onFinish}>
        Done
      </Button>
    </div>
  );
}
