import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import OptionButton from "@/components/ui/OptionButton";
import type { SessionConfig } from "@/lib/storage";
import { strings } from "@/lib/i18n";

type Pace = "slow" | "medium" | "fast";

const ROUND_OPTIONS = [1, 2, 3, 4, 5];
const BREATH_OPTIONS = [20, 30, 40];
const PACE_OPTIONS: { value: Pace; label: string }[] = [
  { value: "slow", label: strings.breathe.paceOptions.slow },
  { value: "medium", label: strings.breathe.paceOptions.medium },
  { value: "fast", label: strings.breathe.paceOptions.fast },
];

const PRESETS: { name: string; description: string; config: SessionConfig }[] = [
  { name: strings.breathe.presets.beginner.name, description: strings.breathe.presets.beginner.description, config: { rounds: 3, breathsPerRound: [30, 30, 30], pace: "slow", retentionMode: "free", autoCold: false } },
  { name: strings.breathe.presets.standard.name, description: strings.breathe.presets.standard.description, config: { rounds: 3, breathsPerRound: [30, 30, 30], pace: "medium", retentionMode: "free", autoCold: false } },
  { name: strings.breathe.presets.deepPractice.name, description: strings.breathe.presets.deepPractice.description, config: { rounds: 4, breathsPerRound: [40, 40, 40, 40], pace: "medium", retentionMode: "free", autoCold: false } },
  { name: strings.breathe.presets.morningActivation.name, description: strings.breathe.presets.morningActivation.description, config: { rounds: 3, breathsPerRound: [30, 30, 30], pace: "fast", retentionMode: "free", autoCold: false } },
];

interface BreathingConfigProps {
  config: SessionConfig;
  onConfigChange: (config: SessionConfig) => void;
  onStart: () => void;
}

export default function BreathingConfig({ config, onConfigChange, onStart }: BreathingConfigProps) {
  return (
    <div className="flex flex-col gap-6 px-4 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{strings.breathe.heading}</h1>

      <div className="grid grid-cols-2 gap-3">
        {PRESETS.map((preset) => {
          const isActive =
            config.rounds === preset.config.rounds &&
            config.breathsPerRound.length === preset.config.breathsPerRound.length &&
            config.breathsPerRound.every((v, i) => v === preset.config.breathsPerRound[i]) &&
            config.pace === preset.config.pace;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => onConfigChange(preset.config)}
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

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {strings.breathe.rounds}
        </h2>
        <div className="flex gap-2">
          {ROUND_OPTIONS.map((n) => (
            <OptionButton
              key={n}
              selected={config.rounds === n}
              onClick={() => {
                const lastBreathCount = config.breathsPerRound[config.breathsPerRound.length - 1] ?? 30;
                const newBreaths = Array.from({ length: n }, (_, i) => config.breathsPerRound[i] ?? lastBreathCount);
                onConfigChange({ ...config, rounds: n, breathsPerRound: newBreaths });
              }}
            >
              {n}
            </OptionButton>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {strings.breathe.breathsPerRound}
        </h2>
        <div className="flex gap-2">
          {BREATH_OPTIONS.map((n) => (
            <OptionButton
              key={n}
              selected={config.breathsPerRound[0] === n && config.breathsPerRound.every((v) => v === n)}
              onClick={() => onConfigChange({ ...config, breathsPerRound: Array.from({ length: config.rounds }, () => n) })}
            >
              {n}
            </OptionButton>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {strings.breathe.pace}
        </h2>
        <div className="flex gap-2">
          {PACE_OPTIONS.map((p) => (
            <OptionButton
              key={p.value}
              selected={config.pace === p.value}
              onClick={() => onConfigChange({ ...config, pace: p.value })}
            >
              {p.label}
            </OptionButton>
          ))}
        </div>
      </Card>

      <Button size="lg" className="mt-2 w-full" onClick={onStart}>
        {strings.breathe.startSession}
      </Button>
    </div>
  );
}
