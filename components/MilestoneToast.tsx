"use client";

import { useEffect, useState, useCallback } from "react";
import {
  subscribeMilestones,
  consumePendingMilestone,
  MILESTONE_DEFINITIONS,
  type Milestone,
} from "@/lib/milestones";

const ICON_MAP: Record<string, string> = {
  lungs: "\u{1FAC1}",
  snowflake: "\u2744\uFE0F",
  fire: "\uD83D\uDD25",
  calendar: "\uD83D\uDCC5",
  trophy: "\uD83C\uDFC6",
  medal: "\uD83C\uDFC5",
  graduation: "\uD83C\uDF93",
};

function MilestoneDisplay({
  milestone,
  onDismiss,
}: {
  milestone: Milestone;
  onDismiss: () => void;
}) {
  const definition = MILESTONE_DEFINITIONS[milestone.type];
  const icon = ICON_MAP[definition.icon] ?? "\u2B50";

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="animate-slide-up fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm">
      <button
        type="button"
        onClick={onDismiss}
        className="flex w-full items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 shadow-lg dark:border-amber-700/50 dark:from-amber-900/40 dark:to-yellow-900/30"
      >
        <span className="text-4xl">{icon}</span>
        <div className="flex-1 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Achievement Unlocked
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
            {definition.title}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {definition.description}
          </p>
        </div>
      </button>
    </div>
  );
}

export default function MilestoneToast() {
  const [current, setCurrent] = useState<Milestone | null>(null);

  const processNext = useCallback(() => {
    const next = consumePendingMilestone();
    if (next) {
      setCurrent(next);
    } else {
      setCurrent(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeMilestones(() => {
      // Only show if nothing is currently displayed
      if (!current) {
        processNext();
      }
    });
    return unsubscribe;
  }, [current, processNext]);

  const handleDismiss = useCallback(() => {
    setCurrent(null);
    // Show next milestone after a short delay
    setTimeout(() => {
      const next = consumePendingMilestone();
      if (next) setCurrent(next);
    }, 300);
  }, []);

  if (!current) return null;

  return <MilestoneDisplay milestone={current} onDismiss={handleDismiss} />;
}
