"use client";

import { useCallback, useRef, useState } from "react";
import PowerBreaths from "./PowerBreaths";
import RetentionHold from "./RetentionHold";
import RecoveryBreath from "./RecoveryBreath";
import SessionComplete from "./SessionComplete";

type Pace = "slow" | "medium" | "fast";

export interface SessionConfig {
  rounds: number;
  breathsPerRound: number;
  pace: Pace;
}

type Phase = "power-breaths" | "retention" | "recovery" | "complete";

interface SessionRunnerProps {
  config: SessionConfig;
  onFinish: () => void;
}

export default function SessionRunner({ config, onFinish }: SessionRunnerProps) {
  const [phase, setPhase] = useState<Phase>("power-breaths");
  const [currentRound, setCurrentRound] = useState(1);
  const [retentionTimes, setRetentionTimes] = useState<number[]>([]);
  const sessionStartRef = useRef(Date.now());
  const [totalDurationMs, setTotalDurationMs] = useState(0);

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
      setTotalDurationMs(Date.now() - sessionStartRef.current);
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
    <SessionComplete
      rounds={config.rounds}
      breathsPerRound={config.breathsPerRound}
      pace={config.pace}
      retentionTimes={retentionTimes}
      totalDurationMs={totalDurationMs}
      onDone={onFinish}
    />
  );
}
