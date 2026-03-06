"use client";

import { useState, useEffect } from "react";
import {
  getPreferences,
  savePreferences,
  profileToDefaults,
  type UserPreferences,
  type CustomPreset,
} from "@/lib/storage";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import OptionButton from "@/components/ui/OptionButton";
import ProfileSetup from "@/components/ProfileSetup";
import AudioSettings from "@/components/settings/AudioSettings";
import BreathingDefaults from "@/components/settings/BreathingDefaults";
import DataManagement from "@/components/settings/DataManagement";
import DailyReminder from "@/components/settings/DailyReminder";
import ToggleCard from "@/components/settings/ToggleCard";
import Link from "next/link";
import { strings } from "@/lib/i18n";

const COLD_TARGET_OPTIONS = [
  { value: 30, label: strings.settings.coldTargetOptions["30"] },
  { value: 60, label: strings.settings.coldTargetOptions["60"] },
  { value: 90, label: strings.settings.coldTargetOptions["90"] },
  { value: 120, label: strings.settings.coldTargetOptions["120"] },
  { value: 180, label: strings.settings.coldTargetOptions["180"] },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);

  useEffect(() => {
    const p = getPreferences();
    setPrefs(p);
    setCustomPresets(p.customPresets ?? []);
  }, []);

  function update(patch: Partial<UserPreferences>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePreferences(patch);
  }

  if (!prefs) return null;

  return (
    <div className="flex flex-col gap-6 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-12">
      <h1 className="text-2xl font-bold">{strings.settings.heading}</h1>

      <AudioSettings audioMode={prefs.audioMode} onUpdate={update} />

      <ToggleCard
        title={strings.settings.screenWakeLock}
        description={strings.settings.wakeLockDescription}
        checked={prefs.wakeLockEnabled}
        ariaLabel="Screen wake lock"
        onToggle={() => update({ wakeLockEnabled: !prefs.wakeLockEnabled })}
      />

      <ToggleCard
        title={strings.settings.reducedMotion}
        description={strings.settings.reducedMotionDescription}
        checked={prefs.reducedMotion}
        ariaLabel="Reduced motion"
        onToggle={() => update({ reducedMotion: !prefs.reducedMotion })}
      />

      <DailyReminder />

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
          {strings.settings.practiceProfile}
        </h2>
        <Button variant="secondary" size="sm" onClick={() => setShowProfile(true)}>
          {strings.settings.editProfile}
        </Button>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
          {strings.settings.customPresets}
        </h2>
        {customPresets.length === 0 ? (
          <p className="text-xs text-on-surface-light-muted dark:text-on-surface-faint">{strings.settings.noCustomPresets}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {customPresets.map((preset) => (
              <li key={preset.id} className="flex items-center justify-between rounded-xl bg-on-surface-light/[0.06] px-3 py-2 dark:bg-surface-overlay/60">
                <div>
                  <span className="block text-sm font-semibold text-on-surface-light dark:text-on-surface">{preset.name}</span>
                  <span className="block text-xs text-on-surface-light-muted dark:text-on-surface-muted">
                    {strings.settings.presetRounds(preset.config.rounds)} · {preset.config.breathsPerRound[0]}b · {preset.config.pace}
                  </span>
                </div>
                <Button variant="danger" size="sm" onClick={() => {
                  const updated = customPresets.filter((p) => p.id !== preset.id);
                  setCustomPresets(updated);
                  savePreferences({ customPresets: updated });
                }}>
                  {strings.settings.deletePreset}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <BreathingDefaults defaultRounds={prefs.defaultRounds} defaultBreathCount={prefs.defaultBreathCount} defaultPace={prefs.defaultPace} onUpdate={update} />

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">{strings.settings.temperatureUnit}</h2>
        <div className="flex gap-2">
          <OptionButton selected={prefs.temperatureUnit === "celsius"} onClick={() => update({ temperatureUnit: "celsius" })}>°C</OptionButton>
          <OptionButton selected={prefs.temperatureUnit === "fahrenheit"} onClick={() => update({ temperatureUnit: "fahrenheit" })}>°F</OptionButton>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">{strings.settings.defaultColdTarget}</h2>
        <div className="flex flex-wrap gap-2">
          {COLD_TARGET_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={prefs.defaultColdTarget === opt.value} onClick={() => update({ defaultColdTarget: opt.value })}>{opt.label}</OptionButton>
          ))}
        </div>
      </Card>

      <DataManagement onDataCleared={() => setPrefs(getPreferences())} />

      <Link href="/privacy" className="block text-center text-xs text-brand underline dark:text-brand-light">
        Privacy Policy
      </Link>

      <p className="text-center text-xs text-on-surface-light-muted">{strings.app.version}</p>

      <Modal open={showProfile} onClose={() => setShowProfile(false)} title={strings.settings.practiceProfile}>
        <ProfileSetup
          initialGoal={prefs.primaryGoal}
          initialTime={prefs.availableTime}
          initialLevel={prefs.experienceLevel}
          initialSessionTime={prefs.preferredSessionTime}
          onSave={(profile) => { const defaults = profileToDefaults(profile); update(defaults); setShowProfile(false); }}
        />
      </Modal>
    </div>
  );
}
