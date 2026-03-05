"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import OptionButton from "@/components/ui/OptionButton";
import type { SessionConfig, CustomPreset } from "@/lib/storage";
import { getPreferences, savePreferences, generateId } from "@/lib/storage";
import { strings } from "@/lib/i18n";
import SessionTip from "./SessionTip";

type Pace = "slow" | "medium" | "fast";

const ROUND_OPTIONS = [1, 2, 3, 4, 5];
const BREATH_OPTIONS = [20, 30, 40];
const PACE_OPTIONS: { value: Pace; label: string }[] = [
  { value: "slow", label: strings.breathe.paceOptions.slow },
  { value: "medium", label: strings.breathe.paceOptions.medium },
  { value: "fast", label: strings.breathe.paceOptions.fast },
];

const BUILT_IN_PRESETS: { name: string; description: string; config: SessionConfig }[] = [
  { name: strings.breathe.presets.beginner.name, description: strings.breathe.presets.beginner.description, config: { rounds: 3, breathsPerRound: [30, 30, 30], pace: "slow", retentionMode: "free", autoCold: false } },
  { name: strings.breathe.presets.standard.name, description: strings.breathe.presets.standard.description, config: { rounds: 3, breathsPerRound: [30, 30, 30], pace: "medium", retentionMode: "free", autoCold: false } },
  { name: strings.breathe.presets.deepPractice.name, description: strings.breathe.presets.deepPractice.description, config: { rounds: 4, breathsPerRound: [40, 40, 40, 40], pace: "medium", retentionMode: "free", autoCold: false } },
  { name: strings.breathe.presets.morningActivation.name, description: strings.breathe.presets.morningActivation.description, config: { rounds: 3, breathsPerRound: [30, 30, 30], pace: "fast", retentionMode: "free", autoCold: false } },
];

function configsMatch(a: SessionConfig, b: SessionConfig): boolean {
  return (
    a.rounds === b.rounds &&
    a.breathsPerRound.length === b.breathsPerRound.length &&
    a.breathsPerRound.every((v, i) => v === b.breathsPerRound[i]) &&
    a.pace === b.pace &&
    a.retentionMode === b.retentionMode &&
    a.autoCold === b.autoCold
  );
}

interface BreathingConfigProps {
  config: SessionConfig;
  onConfigChange: (config: SessionConfig) => void;
  onStart: () => void;
}

export default function BreathingConfig({ config, onConfigChange, onStart }: BreathingConfigProps) {
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() => getPreferences().customPresets ?? []);

  function handleSavePreset() {
    const name = presetName.trim();
    if (!name) return;

    if (customPresets.length >= 5) {
      setSaveMessage(strings.breathe.presetLimitReached);
      setTimeout(() => setSaveMessage(null), 2000);
      return;
    }

    const newPreset: CustomPreset = {
      id: generateId(),
      name,
      config: { ...config },
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    savePreferences({ customPresets: updated });
    setPresetName("");
    setShowSavePreset(false);
    setSaveMessage(strings.breathe.presetSaved);
    setTimeout(() => setSaveMessage(null), 2000);
  }

  function handleDeletePreset(id: string) {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    savePreferences({ customPresets: updated });
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{strings.breathe.heading}</h1>

      <SessionTip />

      {/* Built-in presets */}
      <div className="grid grid-cols-2 gap-3">
        {BUILT_IN_PRESETS.map((preset) => {
          const isActive = configsMatch(config, preset.config);
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
                    onClick={() => handleDeletePreset(preset.id)}
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
              selected={config.breathsPerRound.every((v) => v === n)}
              onClick={() => onConfigChange({ ...config, breathsPerRound: Array.from({ length: config.rounds }, () => n) })}
            >
              {n}
            </OptionButton>
          ))}
        </div>

        {config.rounds > 1 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {strings.breathe.perRoundCustomize}
            </p>
            <div className="flex flex-col gap-2">
              {Array.from({ length: config.rounds }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-8 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {strings.breathe.roundLabel(i + 1)}
                  </span>
                  <div className="flex gap-1.5">
                    {BREATH_OPTIONS.map((n) => (
                      <OptionButton
                        key={n}
                        selected={config.breathsPerRound[i] === n}
                        onClick={() => {
                          const newBreaths = [...config.breathsPerRound];
                          newBreaths[i] = n;
                          onConfigChange({ ...config, breathsPerRound: newBreaths });
                        }}
                        size="sm"
                      >
                        {n}
                      </OptionButton>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {strings.breathe.retentionModeDescriptions[config.retentionMode]}
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {strings.breathe.mindsetPrompts}
        </h2>
        <div className="flex flex-col gap-2">
          {Array.from({ length: config.rounds }, (_, i) => (
            <input
              key={i}
              type="text"
              value={config.mindsetPrompts?.[i] ?? ""}
              onChange={(e) => {
                const prompts = Array.from(
                  { length: config.rounds },
                  (_, j) => config.mindsetPrompts?.[j] ?? ""
                );
                prompts[i] = e.target.value;
                onConfigChange({ ...config, mindsetPrompts: prompts });
              }}
              placeholder={strings.breathe.mindsetPromptPlaceholder(i + 1)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500"
            />
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

      {/* Auto Cold Toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {strings.breathe.autoCold}
            </h2>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {strings.breathe.autoColdDescription}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.autoCold}
            onClick={() => onConfigChange({ ...config, autoCold: !config.autoCold })}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              config.autoCold
                ? "bg-cyan-500"
                : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                config.autoCold ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Save as Preset */}
      {showSavePreset ? (
        <Card>
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={strings.breathe.presetNamePlaceholder}
              maxLength={30}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePreset();
              }}
            />
            <Button size="sm" onClick={handleSavePreset} disabled={!presetName.trim()}>
              {strings.common.done}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setShowSavePreset(false); setPresetName(""); }}>
              {strings.settings.clearConfirm.cancel}
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => setShowSavePreset(true)}>
          {strings.breathe.saveAsPreset}
        </Button>
      )}

      {saveMessage && (
        <p className="text-center text-sm font-medium text-emerald-500 dark:text-emerald-400">
          {saveMessage}
        </p>
      )}

      <Button size="lg" className="mt-2 w-full" onClick={onStart}>
        {strings.breathe.startSession}
      </Button>
    </div>
  );
}
