"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unlockAudio, disposeAudio } from "@/lib/audio";
import { strings } from "@/lib/i18n";
import {
  getPreferences,
  getBreathingSessions,
  saveBreathingSession,
  savePreferences,
  generateId,
  type BreathingSession,
} from "@/lib/storage";
import type { SessionConfig } from "@/lib/storage";
import { requestWakeLock, releaseWakeLock } from "@/lib/wakeLock";
import GuidedOverlay from "./GuidedOverlay";
import PowerBreaths from "./PowerBreaths";
import RetentionHold from "./RetentionHold";
import RecoveryBreath from "./RecoveryBreath";
import SessionComplete from "./SessionComplete";

export type { SessionConfig } from "@/lib/storage";

type Phase = "power-breaths" | "retention" | "recovery" | "complete";

interface SessionRunnerProps {
  config: SessionConfig;
  onFinish: () => void;
  onAutoCold?: () => void;
}

export default function SessionRunner({ config, onFinish, onAutoCold }: SessionRunnerProps) {
  const [phase, setPhase] = useState<Phase>("power-breaths");
  const [currentRound, setCurrentRound] = useState(1);
  const [retentionTimes, setRetentionTimes] = useState<number[]>([]);
  const sessionStartRef = useRef(Date.now());
  const [totalDurationMs, setTotalDurationMs] = useState(0);

  // Guided mode state
  const isFirstSession = !getPreferences().firstSessionComplete;
  const [showPreBreathingGuide, setShowPreBreathingGuide] = useState(isFirstSession);
  const [showMidSessionPause, setShowMidSessionPause] = useState(false);

  useEffect(() => {
    unlockAudio();
    if (getPreferences().wakeLockEnabled) {
      requestWakeLock();
    }
    return () => {
      disposeAudio();
      releaseWakeLock();
    };
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
      if (isFirstSession && currentRound === 1) {
        setShowMidSessionPause(true);
      } else {
        setCurrentRound((r) => r + 1);
        setPhase("power-breaths");
      }
    } else {
      const elapsed = Date.now() - sessionStartRef.current;
      setTotalDurationMs(elapsed);

      // Auto-cold: save session immediately and transition to cold timer
      if (config.autoCold && onAutoCold) {
        const retentionTimesSeconds = retentionTimes.map((ms) => Math.round(ms / 1000));
        if (isFirstSession) {
          savePreferences({ firstSessionComplete: true });
        }
        const session: BreathingSession = {
          id: generateId(),
          date: new Date().toISOString(),
          rounds: config.rounds,
          retentionTimes: retentionTimesSeconds,
          totalDuration: Math.round(elapsed / 1000),
          breathsPerRound: config.breathsPerRound[0],
          pace: config.pace,
        };
        saveBreathingSession(session);
        onAutoCold();
        return;
      }

      setPhase("complete");
    }
  }, [currentRound, config, isFirstSession, onAutoCold, retentionTimes]);

  if (showPreBreathingGuide) {
    return (
      <GuidedOverlay
        type="preBreathing"
        onContinue={() => setShowPreBreathingGuide(false)}
      />
    );
  }

  if (showMidSessionPause) {
    return (
      <GuidedOverlay
        type="midSessionPause"
        onContinue={() => {
          setShowMidSessionPause(false);
          setCurrentRound((r) => r + 1);
          setPhase("power-breaths");
        }}
      />
    );
  }

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
    const mindsetPrompt = config.mindsetPrompts?.[currentRound - 1] || undefined;
    let personalBestMs: number | undefined;
    if (config.retentionMode === "target") {
      const sessions = getBreathingSessions();
      let maxSeconds = 0;
      for (const s of sessions) {
        for (const t of s.retentionTimes) {
          if (t > maxSeconds) maxSeconds = t;
        }
      }
      if (maxSeconds > 0) personalBestMs = maxSeconds * 1000;
    }
    return (
      <div>
        <p className="pt-4 text-center text-xs font-medium text-gray-500">
          {strings.breathing.roundProgress(currentRound, config.rounds)}
        </p>
        <RetentionHold
          onComplete={handleRetentionComplete}
          mindsetPrompt={mindsetPrompt}
          retentionMode={config.retentionMode}
          personalBestMs={personalBestMs}
        />
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
      isFirstSession={isFirstSession}
    />
  );
}
