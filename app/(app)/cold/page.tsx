"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ColdTimer from "@/components/cold/ColdTimer";
import { strings } from "@/lib/i18n";

const DURATION_OPTIONS = [30, 60, 90, 120, 180];

function formatLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = seconds / 60;
  return Number.isInteger(m) ? `${m}min` : `${m.toFixed(1)}min`;
}

export default function ColdPage() {
  const [target, setTarget] = useState(60);
  const [active, setActive] = useState(false);

  if (active) {
    return <ColdTimer target={target} onDone={() => setActive(false)} />;
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{strings.cold.heading}</h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {strings.cold.targetDuration}
        </h2>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setTarget(d)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                target === d
                  ? "bg-cyan-500 text-white"
                  : "bg-gray-800 text-gray-300 active:bg-gray-700"
              }`}
            >
              {formatLabel(d)}
            </button>
          ))}
        </div>
      </Card>

      <Button size="lg" className="mt-2 w-full bg-cyan-500 active:bg-cyan-600" onClick={() => setActive(true)}>
        {strings.cold.startTimer}
      </Button>
    </div>
  );
}
