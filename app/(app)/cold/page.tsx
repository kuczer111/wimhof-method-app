'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ColdTimer from '@/components/cold/ColdTimer';
import { strings } from '@/lib/i18n';

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
    <div className="flex flex-col gap-6 px-4 pt-8 pb-[var(--nav-height)]">
      <h1 className="text-2xl font-bold text-on-surface-light dark:text-on-surface">
        {strings.cold.heading}
      </h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
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
                  ? 'bg-cold text-white'
                  : 'bg-surface-overlay text-on-surface-muted active:bg-on-surface-faint'
              }`}
            >
              {formatLabel(d)}
            </button>
          ))}
        </div>
      </Card>

      <Button
        size="lg"
        className="mt-2 w-full bg-cold active:bg-cold-dark"
        onClick={() => setActive(true)}
      >
        {strings.cold.startTimer}
      </Button>
    </div>
  );
}
