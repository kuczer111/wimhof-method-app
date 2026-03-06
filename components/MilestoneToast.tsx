'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  subscribeMilestones,
  consumePendingMilestone,
  MILESTONE_DEFINITIONS,
  type Milestone,
} from '@/lib/milestones';
import {
  LungsIcon,
  SnowflakeIcon,
  FireIcon,
  CalendarIcon,
  TrophyIcon,
  MedalIcon,
  GraduationIcon,
  StarIcon,
} from '@/components/ui/Icon';
import { type ComponentType } from 'react';

const ICON_MAP: Record<
  string,
  ComponentType<{ size?: 'sm' | 'md' | 'lg'; className?: string }>
> = {
  lungs: LungsIcon,
  snowflake: SnowflakeIcon,
  fire: FireIcon,
  calendar: CalendarIcon,
  trophy: TrophyIcon,
  medal: MedalIcon,
  graduation: GraduationIcon,
};

function MilestoneDisplay({
  milestone,
  onDismiss,
}: {
  milestone: Milestone;
  onDismiss: () => void;
}) {
  const definition = MILESTONE_DEFINITIONS[milestone.type];
  const IconComponent = ICON_MAP[definition.icon] ?? StarIcon;

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="animate-slide-up fixed bottom-24 left-4 right-4 z-50 mx-auto max-h-[calc(100dvh-2rem)] max-w-sm overflow-y-auto">
      <button
        type="button"
        onClick={onDismiss}
        className="flex w-full items-center gap-4 rounded-2xl border border-warning-light/40 bg-gradient-to-r from-warning/[0.08] to-warning-light/[0.08] p-4 shadow-lg dark:border-warning-dark/50 dark:from-warning-dark/40 dark:to-warning/30"
      >
        <IconComponent
          size="lg"
          className="shrink-0 text-warning-dark dark:text-warning-light"
        />
        <div className="flex-1 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-warning-dark dark:text-warning-light">
            Achievement Unlocked
          </p>
          <p className="text-lg font-bold text-on-surface-light dark:text-on-surface">
            {definition.title}
          </p>
          <p className="text-sm text-on-surface-faint dark:text-on-surface-muted">
            {definition.description}
          </p>
        </div>
      </button>
    </div>
  );
}

export default function MilestoneToast() {
  const [current, setCurrent] = useState<Milestone | null>(null);
  const currentRef = useRef<Milestone | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const processNext = useCallback(() => {
    const next = consumePendingMilestone();
    setCurrent(next ?? null);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeMilestones(() => {
      // Only show if nothing is currently displayed
      if (!currentRef.current) {
        processNext();
      }
    });
    return unsubscribe;
  }, [processNext]);

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
