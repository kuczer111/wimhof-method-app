"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import OptionButton from "@/components/ui/OptionButton";
import { strings } from "@/lib/i18n";
import type {
  PrimaryGoal,
  AvailableTime,
  ExperienceLevel,
  PreferredTime,
} from "@/lib/storage";

const t = strings.profile;

interface ProfileSetupProps {
  initialGoal?: PrimaryGoal;
  initialTime?: AvailableTime;
  initialLevel?: ExperienceLevel;
  initialSessionTime?: PreferredTime;
  onSave: (profile: {
    primaryGoal: PrimaryGoal;
    availableTime: AvailableTime;
    experienceLevel: ExperienceLevel;
    preferredSessionTime: PreferredTime;
  }) => void;
  onSkip?: () => void;
}

const GOALS: { value: PrimaryGoal; label: string }[] = [
  { value: "stress", label: t.goals.stress },
  { value: "athletic", label: t.goals.athletic },
  { value: "immune", label: t.goals.immune },
  { value: "curiosity", label: t.goals.curiosity },
  { value: "cold", label: t.goals.cold },
];

const TIME_OPTIONS: { value: AvailableTime; label: string }[] = [
  { value: "10", label: t.timeOptions["10"] },
  { value: "20", label: t.timeOptions["20"] },
  { value: "30+", label: t.timeOptions["30+"] },
];

const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "beginner", label: t.levels.beginner },
  { value: "some", label: t.levels.some },
  { value: "regular", label: t.levels.regular },
];

const SESSION_TIMES: { value: PreferredTime; label: string }[] = [
  { value: "morning", label: t.times.morning },
  { value: "midday", label: t.times.midday },
  { value: "evening", label: t.times.evening },
];

export default function ProfileSetup({
  initialGoal,
  initialTime,
  initialLevel,
  initialSessionTime,
  onSave,
  onSkip,
}: ProfileSetupProps) {
  const [goal, setGoal] = useState<PrimaryGoal | undefined>(initialGoal);
  const [time, setTime] = useState<AvailableTime | undefined>(initialTime);
  const [level, setLevel] = useState<ExperienceLevel | undefined>(initialLevel);
  const [sessionTime, setSessionTime] = useState<PreferredTime | undefined>(initialSessionTime);

  const isComplete = goal && time && level && sessionTime;

  function handleSave() {
    if (!isComplete) return;
    onSave({
      primaryGoal: goal,
      availableTime: time,
      experienceLevel: level,
      preferredSessionTime: sessionTime,
    });
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-on-surface-light dark:text-on-surface">{t.title}</h2>
        <p className="mt-1 text-sm text-on-surface-light-muted dark:text-on-surface-muted">{t.subtitle}</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-on-surface-light-muted dark:text-on-surface-muted">
          {t.primaryGoal}
        </label>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <OptionButton key={g.value} selected={goal === g.value} onClick={() => setGoal(g.value)}>
              {g.label}
            </OptionButton>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-on-surface-light-muted dark:text-on-surface-muted">
          {t.availableTime}
        </label>
        <div className="flex gap-2">
          {TIME_OPTIONS.map((o) => (
            <OptionButton key={o.value} selected={time === o.value} onClick={() => setTime(o.value)}>
              {o.label}
            </OptionButton>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-on-surface-light-muted dark:text-on-surface-muted">
          {t.experienceLevel}
        </label>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <OptionButton key={l.value} selected={level === l.value} onClick={() => setLevel(l.value)}>
              {l.label}
            </OptionButton>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-on-surface-light-muted dark:text-on-surface-muted">
          {t.preferredTime}
        </label>
        <div className="flex gap-2">
          {SESSION_TIMES.map((s) => (
            <OptionButton key={s.value} selected={sessionTime === s.value} onClick={() => setSessionTime(s.value)}>
              {s.label}
            </OptionButton>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button size="lg" className="w-full" disabled={!isComplete} onClick={handleSave}>
          {t.save}
        </Button>
        {onSkip && (
          <button onClick={onSkip} className="text-sm text-on-surface-light-muted dark:text-on-surface-faint">
            {t.skipForNow}
          </button>
        )}
      </div>
    </div>
  );
}
