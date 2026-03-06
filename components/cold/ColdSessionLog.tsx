import { useState } from 'react';
import Button from '@/components/ui/Button';
import {
  saveColdSession,
  generateId,
  getPreferences,
  type ColdSession,
} from '@/lib/storage';
import { checkColdMilestones } from '@/lib/milestones';
import {
  formatTime,
  getTemperatureUnitLabel,
  toStorageCelsius,
} from '@/lib/format';
import { strings } from '@/lib/i18n';

const COLD_TYPES: ColdSession['type'][] = [
  'shower',
  'bath',
  'outdoor',
  'other',
];
const FEELING_LABELS = strings.common.feelingLabels;

interface ColdSessionLogProps {
  elapsed: number;
  target: number;
  onDone: () => void;
}

export default function ColdSessionLog({
  elapsed,
  target,
  onDone,
}: ColdSessionLogProps) {
  const [coldType, setColdType] = useState<ColdSession['type']>('shower');
  const [temperature, setTemperature] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  function formatLabel(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = seconds / 60;
    return Number.isInteger(m) ? `${m}min` : `${m.toFixed(1)}min`;
  }

  function handleSave() {
    const session: ColdSession = {
      id: generateId(),
      date: new Date().toISOString(),
      duration: elapsed,
      targetDuration: target,
      type: coldType,
      ...(temperature.trim() && {
        temperature: toStorageCelsius(
          Number(temperature),
          getPreferences().temperatureUnit,
        ),
      }),
      ...(rating !== null && { rating }),
    };
    saveColdSession(session);
    checkColdMilestones(session);
    setSaved(true);
  }

  function handleDone() {
    if (!saved) handleSave();
    onDone();
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-8 pb-24">
      <p className="text-sm font-medium uppercase tracking-wider text-cold-light">
        {strings.cold.sessionComplete}
      </p>
      <p className="text-4xl font-bold text-on-surface-light dark:text-on-surface">
        {formatTime(elapsed)}
      </p>
      <p className="text-sm text-on-surface-light-muted dark:text-on-surface-muted">
        {strings.cold.targetLabel(formatLabel(target))}
      </p>

      {/* Type selector */}
      <div className="w-full max-w-xs">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
          {strings.cold.type}
        </h3>
        <div className="flex flex-wrap gap-2">
          {COLD_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setColdType(t)}
              className={`rounded-xl px-4 py-3 text-sm font-medium capitalize transition-colors ${
                coldType === t
                  ? 'bg-cold text-white'
                  : 'bg-on-surface-light/10 text-on-surface-light-muted active:bg-on-surface-light/15 dark:bg-surface-overlay dark:text-on-surface-muted dark:active:bg-on-surface-faint'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature (optional) */}
      <div className="w-full max-w-xs">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
          {strings.cold.waterTemperature}
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder={strings.cold.temperaturePlaceholder}
            className="w-full rounded-xl border border-on-surface-light/20 bg-on-surface-light/[0.06] px-3 py-2.5 text-sm text-on-surface-light placeholder:text-on-surface-muted focus:border-cold focus:outline-none focus:ring-1 focus:ring-cold dark:border-on-surface-faint dark:bg-surface-overlay/60 dark:text-on-surface dark:placeholder:text-on-surface-faint"
          />
          <span className="text-sm text-on-surface-light-muted dark:text-on-surface-muted">
            {getTemperatureUnitLabel(getPreferences().temperatureUnit)}
          </span>
        </div>
      </div>

      {/* Rating */}
      <div className="w-full max-w-xs">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
          {strings.cold.howDidItFeel}
        </h3>
        <div className="flex justify-center gap-2">
          {FEELING_LABELS.map((label, i) => {
            const value = i + 1;
            const isSelected = rating === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-pressed={isSelected}
                aria-label={`${value} - ${label}`}
                className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-cold text-white'
                    : 'bg-on-surface-light/10 text-on-surface-light-muted active:bg-on-surface-light/15 dark:bg-surface-overlay dark:text-on-surface-muted dark:active:bg-on-surface-faint'
                }`}
              >
                <span className="text-lg font-bold">{value}</span>
                <span className="text-[9px] leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full max-w-xs flex-col gap-3 pt-2">
        {!saved && (
          <Button
            size="lg"
            className="w-full bg-cold active:bg-cold-dark"
            onClick={handleSave}
          >
            {strings.common.saveSession}
          </Button>
        )}
        <Button
          size="lg"
          variant={saved ? 'primary' : 'secondary'}
          className="w-full"
          onClick={handleDone}
        >
          {saved ? strings.common.done : strings.common.skipAndFinish}
        </Button>
      </div>
    </div>
  );
}
