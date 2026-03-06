// Daily reminder notification system
// Uses the Notification API + setTimeout-based scheduling (no persistent scheduler in PWAs).
// Reminders are re-scheduled on each page load from saved preferences.

import { getBreathingSessions, getColdSessions } from "./storage";

const REMINDER_STORAGE_KEY = "whm_reminder_settings";

export interface ReminderSettings {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
}

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 8,
  minute: 0,
};

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

export function getReminderSettings(): ReminderSettings {
  if (typeof window === "undefined") return DEFAULT_REMINDER;
  try {
    const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed != null && typeof parsed === "object") {
        const p = parsed as Record<string, unknown>;
        return {
          enabled: typeof p.enabled === "boolean" ? p.enabled : DEFAULT_REMINDER.enabled,
          hour: typeof p.hour === "number" && p.hour >= 0 && p.hour <= 23 ? p.hour : DEFAULT_REMINDER.hour,
          minute: typeof p.minute === "number" && p.minute >= 0 && p.minute <= 59 ? p.minute : DEFAULT_REMINDER.minute,
        };
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_REMINDER;
}

export function saveReminderSettings(settings: ReminderSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
  if (settings.enabled) {
    scheduleReminder(settings);
  } else {
    cancelReminder();
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/** Check if user practiced (breathing or cold) within the last N hours */
function practicedWithinHours(hours: number): boolean {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;

  const breathing = getBreathingSessions();
  const cold = getColdSessions();

  const recentBreathing = breathing.some((s) => new Date(s.date).getTime() > cutoff);
  const recentCold = cold.some((s) => new Date(s.date).getTime() > cutoff);

  return recentBreathing || recentCold;
}

function showReminder(): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Skip if user practiced within 2 hours
  if (practicedWithinHours(2)) {
    // Re-schedule for tomorrow
    const settings = getReminderSettings();
    if (settings.enabled) scheduleReminder(settings);
    return;
  }

  new Notification("Wim Hof Method", {
    body: "Time for your daily practice session",
    icon: "/icons/icon-192.png",
    tag: "whm-daily-reminder",
  });

  // Re-schedule for tomorrow
  const settings = getReminderSettings();
  if (settings.enabled) scheduleReminder(settings);
}

function getMillisUntilNextReminder(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

export function scheduleReminder(settings: ReminderSettings): void {
  cancelReminder();
  if (!settings.enabled) return;

  const ms = getMillisUntilNextReminder(settings.hour, settings.minute);
  scheduledTimer = setTimeout(showReminder, ms);
}

export function cancelReminder(): void {
  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

/** Call on app startup to restore scheduled reminder from saved settings */
export function initReminders(): void {
  const settings = getReminderSettings();
  if (settings.enabled && getNotificationPermission() === "granted") {
    scheduleReminder(settings);
  }
}
