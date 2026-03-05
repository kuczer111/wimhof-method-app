"use client";

import { useState } from "react";
import SafetyReminder from "@/components/SafetyReminder";
import SessionRunner from "@/components/breathing/SessionRunner";
import ColdTimer from "@/components/cold/ColdTimer";
import { DEFAULT_SESSION_CONFIG, getPreferences, type SessionConfig } from "@/lib/storage";
import BreathingConfig from "@/components/breathing/BreathingConfig";

type PageState = "config" | "running" | "cold";

export default function BreathePage() {
  const [safetyDismissed, setSafetyDismissed] = useState(false);
  const [pageState, setPageState] = useState<PageState>("config");
  const [config, setConfig] = useState<SessionConfig>({ ...DEFAULT_SESSION_CONFIG });

  if (!safetyDismissed) {
    return <SafetyReminder onProceed={() => setSafetyDismissed(true)} />;
  }

  if (pageState === "running") {
    return (
      <SessionRunner
        config={config}
        onFinish={() => setPageState("config")}
        onAutoCold={() => setPageState("cold")}
      />
    );
  }

  if (pageState === "cold") {
    const target = getPreferences().defaultColdTarget;
    return <ColdTimer target={target} onDone={() => setPageState("config")} />;
  }

  return (
    <BreathingConfig
      config={config}
      onConfigChange={setConfig}
      onStart={() => setPageState("running")}
    />
  );
}
