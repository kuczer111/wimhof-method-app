"use client";

import { useState, useEffect } from "react";
import {
  getPreferences,
  savePreferences,
  profileToDefaults,
  clearAllData,
  type UserPreferences,
  type CustomPreset,
} from "@/lib/storage";
import {
  getReminderSettings,
  saveReminderSettings,
  requestNotificationPermission,
  getNotificationPermission,
  type ReminderSettings,
} from "@/lib/notifications";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import OptionButton from "@/components/ui/OptionButton";
import ProfileSetup from "@/components/ProfileSetup";
import { strings } from "@/lib/i18n";

type AudioMode = UserPreferences["audioMode"];
type Pace = UserPreferences["defaultPace"];

const AUDIO_OPTIONS: { value: AudioMode; label: string }[] = [
  { value: "tone", label: strings.settings.audioOptions.tones },
  { value: "silent", label: strings.settings.audioOptions.silent },
];

const ROUND_OPTIONS = [1, 2, 3, 4, 5];
const BREATH_OPTIONS = [20, 30, 40] as const;
const PACE_OPTIONS: { value: Pace; label: string }[] = [
  { value: "slow", label: strings.breathe.paceOptions.slow },
  { value: "medium", label: strings.breathe.paceOptions.medium },
  { value: "fast", label: strings.breathe.paceOptions.fast },
];

const COLD_TARGET_OPTIONS = [
  { value: 30, label: strings.settings.coldTargetOptions["30"] },
  { value: 60, label: strings.settings.coldTargetOptions["60"] },
  { value: 90, label: strings.settings.coldTargetOptions["90"] },
  { value: 120, label: strings.settings.coldTargetOptions["120"] },
  { value: 180, label: strings.settings.coldTargetOptions["180"] },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [reminder, setReminder] = useState<ReminderSettings>({ enabled: false, hour: 8, minute: 0 });
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    const p = getPreferences();
    setPrefs(p);
    setCustomPresets(p.customPresets ?? []);
    setReminder(getReminderSettings());
    setNotifPermission(getNotificationPermission());
  }, []);

  function update(patch: Partial<UserPreferences>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePreferences(patch);
  }

  async function handleClearData() {
    await clearAllData();
    setShowClearConfirm(false);
    setCleared(true);
    setPrefs(getPreferences());
  }

  if (!prefs) return null;

  return (
    <div className="flex flex-col gap-6 px-4 pb-28 pt-12">
      <h1 className="text-2xl font-bold">{strings.settings.heading}</h1>

      {/* Audio Mode */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {strings.settings.audioMode}
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

      {/* Screen Wake Lock */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {strings.settings.screenWakeLock}
            </h2>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {strings.settings.wakeLockDescription}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.wakeLockEnabled}
            onClick={() => update({ wakeLockEnabled: !prefs.wakeLockEnabled })}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              prefs.wakeLockEnabled
                ? "bg-cyan-500"
                : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                prefs.wakeLockEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Daily Reminder */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {strings.settings.dailyReminder}
            </h2>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {strings.settings.reminderDescription}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reminder.enabled}
            onClick={async () => {
              if (!reminder.enabled) {
                const perm = await requestNotificationPermission();
                setNotifPermission(perm);
                if (perm !== "granted") return;
              }
              const next = { ...reminder, enabled: !reminder.enabled };
              setReminder(next);
              saveReminderSettings(next);
            }}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              reminder.enabled
                ? "bg-cyan-500"
                : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                reminder.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {reminder.enabled && (
          <div className="mt-4">
            <label className="mb-2 block text-sm text-gray-600 dark:text-gray-300">
              {strings.settings.reminderTime}
            </label>
            <input
              type="time"
              value={`${String(reminder.hour).padStart(2, "0")}:${String(reminder.minute).padStart(2, "0")}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                const next = { ...reminder, hour: h, minute: m };
                setReminder(next);
                saveReminderSettings(next);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        )}

        {notifPermission === "denied" && (
          <p className="mt-2 text-xs text-red-500">{strings.settings.notificationsBlocked}</p>
        )}
        {notifPermission === "unsupported" && (
          <p className="mt-2 text-xs text-gray-400">{strings.settings.notificationsUnsupported}</p>
        )}
      </Card>

      {/* Practice Profile */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {strings.settings.practiceProfile}
        </h2>
        <Button variant="secondary" size="sm" onClick={() => setShowProfile(true)}>
          {strings.settings.editProfile}
        </Button>
      </Card>

      {/* Custom Presets */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {strings.settings.customPresets}
        </h2>
        {customPresets.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {strings.settings.noCustomPresets}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {customPresets.map((preset) => (
              <li key={preset.id} className="flex items-center justify-between rounded-xl bg-gray-100 px-3 py-2 dark:bg-gray-800/60">
                <div>
                  <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {preset.name}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {strings.settings.presetRounds(preset.config.rounds)} · {preset.config.breathsPerRound[0]}b · {preset.config.pace}
                  </span>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const updated = customPresets.filter((p) => p.id !== preset.id);
                    setCustomPresets(updated);
                    savePreferences({ customPresets: updated });
                  }}
                >
                  {strings.settings.deletePreset}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Default Breathing Config */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {strings.settings.defaultBreathingConfig}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-600 dark:text-gray-300">{strings.settings.rounds}</label>
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
              {strings.settings.breathsPerRound}
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
            <label className="mb-2 block text-sm text-gray-600 dark:text-gray-300">{strings.settings.pace}</label>
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
          {strings.settings.defaultColdTarget}
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
          {strings.settings.data}
        </h2>
        {cleared ? (
          <p className="text-sm text-green-600 dark:text-green-400">{strings.settings.allDataCleared}</p>
        ) : (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
          >
            {strings.settings.clearAllData}
          </Button>
        )}
      </Card>

      {/* App Version */}
      <p className="text-center text-xs text-gray-600">
        {strings.app.version}
      </p>

      {/* Profile Setup Modal */}
      <Modal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        title={strings.settings.practiceProfile}
      >
        <ProfileSetup
          initialGoal={prefs.primaryGoal}
          initialTime={prefs.availableTime}
          initialLevel={prefs.experienceLevel}
          initialSessionTime={prefs.preferredSessionTime}
          onSave={(profile) => {
            const defaults = profileToDefaults(profile);
            update(defaults);
            setShowProfile(false);
          }}
        />
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title={strings.settings.clearConfirm.title}
      >
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          {strings.settings.clearConfirm.description}
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => setShowClearConfirm(false)}
          >
            {strings.settings.clearConfirm.cancel}
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            onClick={handleClearData}
          >
            {strings.settings.clearConfirm.confirm}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
