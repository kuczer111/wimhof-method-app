"use client";

import { useEffect, useState } from "react";
import { getPreferences, savePreferences } from "@/lib/storage";
import Button from "@/components/ui/Button";
import { strings } from "@/lib/i18n";

const SAFETY_RULES = strings.safety.onboarding.rules;

export default function SafetyOnboarding() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefs = getPreferences();
    if (!prefs.safetyAcknowledged) {
      setVisible(true);
    }
  }, []);

  function handleAcknowledge() {
    savePreferences({ safetyAcknowledged: true, onboardingComplete: true });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 p-4 dark:bg-gray-950/95">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 text-center">
          <span className="text-3xl">&#9888;&#65039;</span>
          <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
            {strings.safety.onboarding.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {strings.safety.onboarding.subtitle}
          </p>
        </div>

        <ul className="mb-6 space-y-3">
          {SAFETY_RULES.map((rule) => (
            <li key={rule} className="flex gap-3 text-sm text-gray-700 dark:text-gray-200">
              <span className="mt-0.5 shrink-0 text-yellow-500">&#x2022;</span>
              {rule}
            </li>
          ))}
        </ul>

        <Button
          size="lg"
          className="w-full"
          onClick={handleAcknowledge}
        >
          {strings.safety.onboarding.acknowledge}
        </Button>
      </div>
    </div>
  );
}
