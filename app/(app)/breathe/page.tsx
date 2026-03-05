"use client";

import { useState } from "react";
import SafetyReminder from "@/components/SafetyReminder";
import SessionRunner from "@/components/breathing/SessionRunner";
import type { SessionConfig } from "@/components/breathing/SessionRunner";
import BreathingConfig from "@/components/breathing/BreathingConfig";

export default function BreathePage() {
  const [safetyDismissed, setSafetyDismissed] = useState(false);
  const [running, setRunning] = useState(false);
  const [config, setConfig] = useState<SessionConfig>({
    rounds: 3,
    breathsPerRound: 30,
    pace: "medium",
  });

  if (!safetyDismissed) {
    return <SafetyReminder onProceed={() => setSafetyDismissed(true)} />;
  }

  if (running) {
    return (
      <SessionRunner
        config={config}
        onFinish={() => setRunning(false)}
      />
    );
  }

  return (
    <BreathingConfig
      config={config}
      onConfigChange={setConfig}
      onStart={() => setRunning(true)}
    />
  );
}
