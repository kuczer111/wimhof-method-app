import Card from '@/components/ui/Card';
import OptionButton from '@/components/ui/OptionButton';
import type { UserPreferences } from '@/lib/storage';
import { strings } from '@/lib/i18n';

type Pace = UserPreferences['defaultPace'];

const ROUND_OPTIONS = [1, 2, 3, 4, 5];
const BREATH_OPTIONS = [20, 30, 40] as const;
const PACE_OPTIONS: { value: Pace; label: string }[] = [
  { value: 'slow', label: strings.breathe.paceOptions.slow },
  { value: 'medium', label: strings.breathe.paceOptions.medium },
  { value: 'fast', label: strings.breathe.paceOptions.fast },
];

interface BreathingDefaultsProps {
  defaultRounds: number;
  defaultBreathCount: number;
  defaultPace: Pace;
  onUpdate: (patch: Partial<UserPreferences>) => void;
}

export default function BreathingDefaults({
  defaultRounds,
  defaultBreathCount,
  defaultPace,
  onUpdate,
}: BreathingDefaultsProps) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
        {strings.settings.defaultBreathingConfig}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-on-surface-light-muted dark:text-on-surface-muted">
            {strings.settings.rounds}
          </label>
          <div className="flex gap-2">
            {ROUND_OPTIONS.map((n) => (
              <OptionButton
                key={n}
                selected={defaultRounds === n}
                onClick={() => onUpdate({ defaultRounds: n })}
              >
                {n}
              </OptionButton>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-on-surface-light-muted dark:text-on-surface-muted">
            {strings.settings.breathsPerRound}
          </label>
          <div className="flex gap-2">
            {BREATH_OPTIONS.map((n) => (
              <OptionButton
                key={n}
                selected={defaultBreathCount === n}
                onClick={() => onUpdate({ defaultBreathCount: n })}
              >
                {n}
              </OptionButton>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-on-surface-light-muted dark:text-on-surface-muted">
            {strings.settings.pace}
          </label>
          <div className="flex gap-2">
            {PACE_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.value}
                selected={defaultPace === opt.value}
                onClick={() => onUpdate({ defaultPace: opt.value })}
              >
                {opt.label}
              </OptionButton>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
