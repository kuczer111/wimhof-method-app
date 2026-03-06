import type { SessionConfig, CustomPreset } from "@/lib/storage";
import { strings } from "@/lib/i18n";

const BUILT_IN_PRESETS: { name: string; description: string; config: SessionConfig }[] = [
  { name: strings.breathe.presets.beginner.name, description: strings.breathe.presets.beginner.description, config: { rounds: 3, breathsPerRound: [30, 30, 30], pace: "slow", retentionMode: "free", autoCold: false } },
  { name: strings.breathe.presets.standard.name, description: strings.breathe.presets.standard.description, config: { rounds: 3, breathsPerRound: [30, 30, 30], pace: "medium", retentionMode: "free", autoCold: false } },
  { name: strings.breathe.presets.deepPractice.name, description: strings.breathe.presets.deepPractice.description, config: { rounds: 4, breathsPerRound: [40, 40, 40, 40], pace: "medium", retentionMode: "free", autoCold: false } },
  { name: strings.breathe.presets.morningActivation.name, description: strings.breathe.presets.morningActivation.description, config: { rounds: 3, breathsPerRound: [30, 30, 30], pace: "fast", retentionMode: "free", autoCold: false } },
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

export default function PresetGrid({ config, onConfigChange, customPresets, onDeletePreset }: PresetGridProps) {
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
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-gray-200 bg-gray-100/50 active:bg-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:active:bg-gray-700"
              }`}
            >
              <span className={`block text-sm font-semibold ${isActive ? "text-sky-500 dark:text-sky-400" : "text-gray-800 dark:text-gray-100"}`}>
                {preset.name}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom presets */}
      {customPresets.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
                      ? "border-sky-500 bg-sky-500/10"
                      : "border-gray-200 bg-gray-100/50 dark:border-gray-700 dark:bg-gray-800/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onConfigChange(preset.config)}
                    className="w-full text-left"
                  >
                    <span className={`block text-sm font-semibold ${isActive ? "text-sky-500 dark:text-sky-400" : "text-gray-800 dark:text-gray-100"}`}>
                      {preset.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                      {preset.config.rounds}r · {preset.config.breathsPerRound[0]}b · {preset.config.pace}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePreset(preset.id)}
                    className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                    aria-label={`Delete ${preset.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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
