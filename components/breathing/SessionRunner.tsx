"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unlockAudio, disposeAudio } from "@/lib/audio";
import { strings } from "@/lib/i18n";
import type { SessionConfig } from "@/lib/storage";
import PowerBreaths from "./PowerBreaths";
import RetentionHold from "./RetentionHold";
import RecoveryBreath from "./RecoveryBreath";
import SessionComplete from "./SessionComplete";

export type { SessionConfig } from "@/lib/storage";

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

  useEffect(() => {
    unlockAudio();
    return () => disposeAudio();
  }, []);

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
          {strings.breathing.roundProgress(currentRound, config.rounds)}
        </p>
        <PowerBreaths
          breathCount={config.breathsPerRound[currentRound - 1] ?? config.breathsPerRound[0]}
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
          {strings.breathing.roundProgress(currentRound, config.rounds)}
        </p>
        <RetentionHold onComplete={handleRetentionComplete} />
      </div>
    );
  }

  if (phase === "recovery") {
    return (
      <div>
        <p className="pt-4 text-center text-xs font-medium text-gray-500">
          {strings.breathing.roundProgress(currentRound, config.rounds)}
        </p>
        <RecoveryBreath onComplete={handleRecoveryComplete} />
      </div>
    );
  }

  // complete
  return (
    <SessionComplete
      config={config}
      retentionTimes={retentionTimes}
      totalDurationMs={totalDurationMs}
      onDone={onFinish}
    />
  );
}
