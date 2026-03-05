"use client";

import { useState } from "react";
import SafetyReminder from "@/components/SafetyReminder";

export default function BreathePage() {
  const [safetyDismissed, setSafetyDismissed] = useState(false);

  if (!safetyDismissed) {
    return <SafetyReminder onProceed={() => setSafetyDismissed(true)} />;
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 pt-12">
      <h1 className="text-2xl font-bold">Breathe</h1>
      <p className="mt-2 text-gray-400">Guided breathing sessions</p>
    </div>
  );
}
