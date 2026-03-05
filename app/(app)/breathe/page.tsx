"use client";

import { useState } from "react";
import SafetyReminder from "@/components/SafetyReminder";
import SessionRunner from "@/components/breathing/SessionRunner";
import type { SessionConfig } from "@/components/breathing/SessionRunner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type Pace = "slow" | "medium" | "fast";

const ROUND_OPTIONS = [1, 2, 3, 4, 5];
const BREATH_OPTIONS = [20, 30, 40];
const PACE_OPTIONS: { value: Pace; label: string }[] = [
  { value: "slow", label: "Slow" },
  { value: "medium", label: "Medium" },
  { value: "fast", label: "Fast" },
];

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
        selected
          ? "bg-sky-500 text-white"
          : "bg-gray-800 text-gray-300 active:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

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
    <div className="flex flex-col gap-6 px-4 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-50">Breathing Session</h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Rounds
        </h2>
        <div className="flex gap-2">
          {ROUND_OPTIONS.map((n) => (
            <OptionButton
              key={n}
              selected={config.rounds === n}
              onClick={() => setConfig((c) => ({ ...c, rounds: n }))}
            >
              {n}
            </OptionButton>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Breaths per Round
        </h2>
        <div className="flex gap-2">
          {BREATH_OPTIONS.map((n) => (
            <OptionButton
              key={n}
              selected={config.breathsPerRound === n}
              onClick={() => setConfig((c) => ({ ...c, breathsPerRound: n }))}
            >
              {n}
            </OptionButton>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Pace
        </h2>
        <div className="flex gap-2">
          {PACE_OPTIONS.map((p) => (
            <OptionButton
              key={p.value}
              selected={config.pace === p.value}
              onClick={() => setConfig((c) => ({ ...c, pace: p.value }))}
            >
              {p.label}
            </OptionButton>
          ))}
        </div>
      </Card>

      <Button size="lg" className="mt-2 w-full" onClick={() => setRunning(true)}>
        Start Session
      </Button>
    </div>
  );
}
