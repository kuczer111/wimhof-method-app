import Card from "@/components/ui/Card";
import {
  getReminderSettings,
  saveReminderSettings,
  requestNotificationPermission,
  getNotificationPermission,
  type ReminderSettings,
} from "@/lib/notifications";
import { strings } from "@/lib/i18n";
import { useState, useEffect } from "react";

export default function DailyReminder() {
  const [reminder, setReminder] = useState<ReminderSettings>({ enabled: false, hour: 8, minute: 0 });
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setReminder(getReminderSettings());
    setNotifPermission(getNotificationPermission());
  }, []);

  return (
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
          aria-label="Daily reminder"
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
  );
}
