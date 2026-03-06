"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import OptionButton from "@/components/ui/OptionButton";
import type { SessionConfig, CustomPreset } from "@/lib/storage";
import { getPreferences, savePreferences } from "@/lib/storage";
import { strings } from "@/lib/i18n";
import SessionTip from "./SessionTip";
import PresetGrid from "./PresetGrid";
import PerRoundConfig from "./PerRoundConfig";
import MindsetPrompts from "./MindsetPrompts";
import SavePresetForm from "./SavePresetForm";
import ToggleCard from "@/components/settings/ToggleCard";

const ROUND_OPTIONS = [1, 2, 3, 4, 5];
const BREATH_OPTIONS = [20, 30, 40];
const PACE_OPTIONS: { value: "slow" | "medium" | "fast"; label: string }[] = [
  { value: "slow", label: strings.breathe.paceOptions.slow },
  { value: "medium", label: strings.breathe.paceOptions.medium },
  { value: "fast", label: strings.breathe.paceOptions.fast },
];

interface BreathingConfigProps {
  config: SessionConfig;
  onConfigChange: (config: SessionConfig) => void;
  onStart: () => void;
}

export default function BreathingConfig({ config, onConfigChange, onStart }: BreathingConfigProps) {
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() => getPreferences().customPresets ?? []);

  function handleDeletePreset(id: string) {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    savePreferences({ customPresets: updated });
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-on-surface-light dark:text-on-surface">{strings.breathe.heading}</h1>

      <SessionTip />

      <PresetGrid
        config={config}
        onConfigChange={onConfigChange}
        customPresets={customPresets}
        onDeletePreset={handleDeletePreset}
      />

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
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
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
          {strings.breathe.breathsPerRound}
        </h2>
        <div className="flex gap-2">
          {BREATH_OPTIONS.map((n) => (
            <OptionButton
              key={n}
              selected={config.breathsPerRound.every((v) => v === n)}
              onClick={() => onConfigChange({ ...config, breathsPerRound: Array.from({ length: config.rounds }, () => n) })}
            >
              {n}
            </OptionButton>
          ))}
        </div>
        <PerRoundConfig config={config} onConfigChange={onConfigChange} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
          {strings.breathe.retentionMode}
        </h2>
        <div className="flex gap-2">
          {(["free", "target"] as const).map((mode) => (
            <OptionButton
              key={mode}
              selected={config.retentionMode === mode}
              onClick={() => onConfigChange({ ...config, retentionMode: mode })}
            >
              {strings.breathe.retentionModeOptions[mode]}
            </OptionButton>
          ))}
        </div>
        <p className="mt-2 text-xs text-on-surface-light-muted dark:text-on-surface-muted">
          {strings.breathe.retentionModeDescriptions[config.retentionMode]}
        </p>
      </Card>

      <MindsetPrompts config={config} onConfigChange={onConfigChange} />

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
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

      <ToggleCard
        title={strings.breathe.autoCold}
        description={strings.breathe.autoColdDescription}
        checked={config.autoCold}
        ariaLabel="Auto cold exposure"
        onToggle={() => onConfigChange({ ...config, autoCold: !config.autoCold })}
      />

      <SavePresetForm
        config={config}
        customPresets={customPresets}
        onPresetsChange={setCustomPresets}
      />

      <Button size="lg" className="mt-2 w-full" onClick={onStart}>
        {strings.breathe.startSession}
      </Button>
    </div>
  );
}
