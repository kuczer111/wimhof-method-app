import type { SessionConfig, CustomPreset } from '@/lib/storage';
import { strings } from '@/lib/i18n';

const BUILT_IN_PRESETS: {
  name: string;
  description: string;
  config: SessionConfig;
}[] = [
  {
    name: strings.breathe.presets.beginner.name,
    description: strings.breathe.presets.beginner.description,
    config: {
      rounds: 3,
      breathsPerRound: [30, 30, 30],
      pace: 'slow',
      retentionMode: 'free',
      autoCold: false,
    },
  },
  {
    name: strings.breathe.presets.standard.name,
    description: strings.breathe.presets.standard.description,
    config: {
      rounds: 3,
      breathsPerRound: [30, 30, 30],
      pace: 'medium',
      retentionMode: 'free',
      autoCold: false,
    },
  },
  {
    name: strings.breathe.presets.deepPractice.name,
    description: strings.breathe.presets.deepPractice.description,
    config: {
      rounds: 4,
      breathsPerRound: [40, 40, 40, 40],
      pace: 'medium',
      retentionMode: 'free',
      autoCold: false,
    },
  },
  {
    name: strings.breathe.presets.morningActivation.name,
    description: strings.breathe.presets.morningActivation.description,
    config: {
      rounds: 3,
      breathsPerRound: [30, 30, 30],
      pace: 'fast',
      retentionMode: 'free',
      autoCold: false,
    },
  },
];

export function configsMatch(a: SessionConfig, b: SessionConfig): boolean {
  return (
    a.rounds === b.rounds &&
    a.breathsPerRound.length === b.breathsPerRound.length &&
    a.breathsPerRound.every((v, i) => v === b.breathsPerRound[i]) &&
    a.pace === b.pace &&
    a.retentionMode === b.retentionMode &&
    a.autoCold === b.autoCold
  );
}

interface PresetGridProps {
  config: SessionConfig;
  onConfigChange: (config: SessionConfig) => void;
  customPresets: CustomPreset[];
  onDeletePreset: (id: string) => void;
}

export default function PresetGrid({
  config,
  onConfigChange,
  customPresets,
  onDeletePreset,
}: PresetGridProps) {
  return (
    <>
      {/* Built-in presets */}
      <div className="grid grid-cols-2 gap-3">
        {BUILT_IN_PRESETS.map((preset) => {
          const isActive = configsMatch(config, preset.config);
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => onConfigChange(preset.config)}
              aria-pressed={isActive}
              aria-label={`${preset.name} preset: ${preset.description}`}
              className={`rounded-2xl border p-3 text-left transition-colors ${
                isActive
                  ? 'border-brand bg-brand/10'
                  : 'border-on-surface-light/[0.12] bg-on-surface-light/[0.04] active:bg-on-surface-light/[0.08] dark:border-surface-overlay dark:bg-surface-overlay/50 dark:active:bg-surface-overlay'
              }`}
            >
              <span
                className={`block text-sm font-semibold ${isActive ? 'text-brand dark:text-brand-light' : 'text-on-surface-light dark:text-on-surface'}`}
              >
                {preset.name}
              </span>
              <span className="mt-0.5 block text-xs text-on-surface-light-muted dark:text-on-surface-muted">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom presets */}
      {customPresets.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
            {strings.breathe.customPresetLabel}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {customPresets.map((preset) => {
              const isActive = configsMatch(config, preset.config);
              return (
                <div
                  key={preset.id}
                  className={`relative rounded-2xl border p-3 text-left transition-colors ${
                    isActive
                      ? 'border-brand bg-brand/10'
                      : 'border-on-surface-light/[0.12] bg-on-surface-light/[0.04] dark:border-surface-overlay dark:bg-surface-overlay/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onConfigChange(preset.config)}
                    className="w-full text-left"
                  >
                    <span
                      className={`block text-sm font-semibold ${isActive ? 'text-brand dark:text-brand-light' : 'text-on-surface-light dark:text-on-surface'}`}
                    >
                      {preset.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-on-surface-light-muted dark:text-on-surface-muted">
                      {preset.config.rounds}r ·{' '}
                      {preset.config.breathsPerRound[0]}b · {preset.config.pace}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePreset(preset.id)}
                    className="absolute -right-1 -top-1 flex h-[44px] w-[44px] items-center justify-center rounded-full text-on-surface-light-muted hover:text-danger active:text-danger dark:text-on-surface-faint dark:hover:text-danger-light dark:active:text-danger-light"
                    aria-label={`Delete ${preset.name}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
