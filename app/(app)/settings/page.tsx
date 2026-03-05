"use client";

import { useState, useEffect } from "react";
import {
  getPreferences,
  savePreferences,
  type UserPreferences,
} from "@/lib/storage";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";

type AudioMode = UserPreferences["audioMode"];
type Pace = UserPreferences["defaultPace"];

const AUDIO_OPTIONS: { value: AudioMode; label: string }[] = [
  { value: "tone", label: "Tones" },
  { value: "silent", label: "Silent" },
];

const ROUND_OPTIONS = [1, 2, 3, 4, 5];
const BREATH_OPTIONS = [20, 30, 40] as const;
const PACE_OPTIONS: { value: Pace; label: string }[] = [
  { value: "slow", label: "Slow" },
  { value: "medium", label: "Medium" },
  { value: "fast", label: "Fast" },
];

const COLD_TARGET_OPTIONS = [
  { value: 30, label: "30s" },
  { value: 60, label: "1 min" },
  { value: 90, label: "1.5 min" },
  { value: 120, label: "2 min" },
  { value: 180, label: "3 min" },
];

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        selected
          ? "bg-sky-500 text-white"
          : "bg-gray-200 text-gray-500 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:active:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    setPrefs(getPreferences());
  }, []);

  function update(patch: Partial<UserPreferences>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePreferences(patch);
  }

  function handleClearData() {
    localStorage.clear();
    setShowClearConfirm(false);
    setCleared(true);
    setPrefs(getPreferences());
  }

  if (!prefs) return null;

  return (
    <div className="flex flex-col gap-6 px-4 pb-28 pt-12">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Audio Mode */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Audio Mode
        </h2>
        <div className="flex gap-2">
          {AUDIO_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={prefs.audioMode === opt.value}
              onClick={() => update({ audioMode: opt.value })}
            >
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </Card>

      {/* Default Breathing Config */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Default Breathing Config
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-600 dark:text-gray-300">Rounds</label>
            <div className="flex gap-2">
              {ROUND_OPTIONS.map((n) => (
                <OptionButton
                  key={n}
                  selected={prefs.defaultRounds === n}
                  onClick={() => update({ defaultRounds: n })}
                >
                  {n}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-600 dark:text-gray-300">
              Breaths per round
            </label>
            <div className="flex gap-2">
              {BREATH_OPTIONS.map((n) => (
                <OptionButton
                  key={n}
                  selected={prefs.defaultBreathCount === n}
                  onClick={() => update({ defaultBreathCount: n })}
                >
                  {n}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-600 dark:text-gray-300">Pace</label>
            <div className="flex gap-2">
              {PACE_OPTIONS.map((opt) => (
                <OptionButton
                  key={opt.value}
                  selected={prefs.defaultPace === opt.value}
                  onClick={() => update({ defaultPace: opt.value })}
                >
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Cold Target Default */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Default Cold Target
        </h2>
        <div className="flex flex-wrap gap-2">
          {COLD_TARGET_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={prefs.defaultColdTarget === opt.value}
              onClick={() => update({ defaultColdTarget: opt.value })}
            >
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </Card>

      {/* Clear Data */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Data
        </h2>
        {cleared ? (
          <p className="text-sm text-green-600 dark:text-green-400">All data cleared.</p>
        ) : (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
          >
            Clear All Data
          </Button>
        )}
      </Card>

      {/* App Version */}
      <p className="text-center text-xs text-gray-600">
        Wim Hof Method App v0.1.0
      </p>

      {/* Clear Confirmation Modal */}
      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Data?"
      >
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          This will permanently delete all your breathing sessions, cold
          sessions, and preferences. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => setShowClearConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            onClick={handleClearData}
          >
            Clear Data
          </Button>
        </div>
      </Modal>
    </div>
  );
}
