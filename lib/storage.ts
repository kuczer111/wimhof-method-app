// Typed storage helpers for the Wim Hof Method app
// Backed by IndexedDB with an in-memory cache for synchronous reads.
// On first load, migrates any existing localStorage data to IndexedDB.

import { getDB } from "./db";

// --- Types ---

export interface BreathingSession {
  id: string;
  date: string; // ISO 8601
  rounds: number;
  retentionTimes: number[]; // seconds per round
  totalDuration: number; // seconds
  breathsPerRound: number;
  pace: "slow" | "medium" | "fast";
  feelingRating?: number; // 1-5
  note?: string;
}

export interface ColdSession {
  id: string;
  date: string; // ISO 8601
  duration: number; // seconds
  targetDuration: number; // seconds
  type: "shower" | "bath" | "outdoor" | "other";
  temperature?: number; // celsius, optional
  rating?: number; // 1-5
}

export type PrimaryGoal = "stress" | "athletic" | "immune" | "curiosity" | "cold";
export type AvailableTime = "10" | "20" | "30+";
export type ExperienceLevel = "beginner" | "some" | "regular";
export type PreferredTime = "morning" | "midday" | "evening";

export interface CustomPreset {
  id: string;
  name: string;
  config: SessionConfig;
}

export interface UserPreferences {
  defaultRounds: number; // 1-5, default 3
  defaultBreathCount: 20 | 30 | 40;
  defaultPace: "slow" | "medium" | "fast";
  defaultColdTarget: number; // seconds
  audioMode: "voice" | "tone" | "silent" | "haptic";
  muted: boolean;
  temperatureUnit: "celsius" | "fahrenheit";
  safetyAcknowledged: boolean;
  onboardingComplete: boolean;
  wakeLockEnabled: boolean;
  reducedMotion: boolean;
  firstSessionComplete?: boolean;
  profileComplete?: boolean;
  primaryGoal?: PrimaryGoal;
  availableTime?: AvailableTime;
  experienceLevel?: ExperienceLevel;
  preferredSessionTime?: PreferredTime;
  customPresets?: CustomPreset[];
  themeMode: "system" | "light" | "dark";
}

export interface SessionConfig {
  rounds: number;
  breathsPerRound: number[]; // breaths per round, e.g. [30, 40, 40]
  pace: "slow" | "medium" | "fast";
  mindsetPrompts?: string[]; // optional prompt per round during retention
  retentionMode: "free" | "target"; // free = open-ended, target = aim for a time
  autoCold: boolean; // auto-transition to cold exposure after session
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  rounds: 3,
  breathsPerRound: [30, 30, 30],
  pace: "medium",
  retentionMode: "free",
  autoCold: false,
};

/**
 * Normalize a saved SessionConfig for backward compatibility.
 * Handles the case where breathsPerRound was previously a single number.
 */
export function normalizeSessionConfig(raw: Record<string, unknown>): SessionConfig {
  const config = { ...DEFAULT_SESSION_CONFIG, ...raw };

  // Backward compat: breathsPerRound was previously a single number
  if (typeof config.breathsPerRound === "number") {
    const count = config.breathsPerRound as number;
    const rounds = typeof config.rounds === "number" ? config.rounds : DEFAULT_SESSION_CONFIG.rounds;
    config.breathsPerRound = Array.from({ length: rounds }, () => count);
  }

  // Ensure retentionMode has a valid value
  if (config.retentionMode !== "free" && config.retentionMode !== "target") {
    config.retentionMode = DEFAULT_SESSION_CONFIG.retentionMode;
  }

  // Ensure autoCold is boolean
  if (typeof config.autoCold !== "boolean") {
    config.autoCold = DEFAULT_SESSION_CONFIG.autoCold;
  }

  return config as SessionConfig;
}

/**
 * Map practice profile selections to sensible default preferences.
 */
export function profileToDefaults(profile: {
  primaryGoal: PrimaryGoal;
  availableTime: AvailableTime;
  experienceLevel: ExperienceLevel;
  preferredSessionTime: PreferredTime;
}): Partial<UserPreferences> {
  const { primaryGoal, availableTime, experienceLevel } = profile;

  let defaultRounds = 3;
  let defaultBreathCount: 20 | 30 | 40 = 30;
  let defaultPace: "slow" | "medium" | "fast" = "medium";
  let defaultColdTarget = 60;

  // Experience level adjustments
  if (experienceLevel === "beginner") {
    defaultRounds = 3;
    defaultBreathCount = 30;
    defaultPace = "slow";
    defaultColdTarget = 30;
  } else if (experienceLevel === "regular") {
    defaultRounds = 4;
    defaultBreathCount = 40;
    defaultPace = "medium";
    defaultColdTarget = 120;
  }

  // Goal-specific tweaks
  if (primaryGoal === "athletic") {
    defaultRounds = Math.min(defaultRounds + 1, 5);
    defaultBreathCount = 40;
  } else if (primaryGoal === "cold") {
    defaultColdTarget = Math.min(defaultColdTarget + 60, 180);
  } else if (primaryGoal === "stress") {
    defaultPace = "slow";
  }

  // Time budget adjustments
  if (availableTime === "10") {
    defaultRounds = Math.min(defaultRounds, 3);
  } else if (availableTime === "30+") {
    defaultRounds = Math.min(defaultRounds + 1, 5);
  }

  return {
    defaultRounds,
    defaultBreathCount,
    defaultPace,
    defaultColdTarget,
    profileComplete: true,
    primaryGoal: profile.primaryGoal,
    availableTime: profile.availableTime,
    experienceLevel: profile.experienceLevel,
    preferredSessionTime: profile.preferredSessionTime,
  };
}

// --- Default preferences ---

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultRounds: 3,
  defaultBreathCount: 30,
  defaultPace: "medium",
  defaultColdTarget: 60,
  audioMode: "tone",
  muted: false,
  temperatureUnit: "celsius",
  safetyAcknowledged: false,
  onboardingComplete: false,
  wakeLockEnabled: true,
  reducedMotion: false,
  themeMode: "system",
};

// --- In-memory cache ---

const cache: {
  breathingSessions: BreathingSession[];
  coldSessions: ColdSession[];
  preferences: UserPreferences;
} = {
  breathingSessions: [],
  coldSessions: [],
  preferences: { ...DEFAULT_PREFERENCES },
};

let initialized = false;
let initPromise: Promise<void> | null = null;

// --- localStorage migration keys ---

const LS_KEYS = {
  breathingSessions: "whm_breathing_sessions",
  coldSessions: "whm_cold_sessions",
  preferences: "whm_preferences",
  migrated: "whm_idb_migrated",
} as const;

// --- Migration: localStorage -> IndexedDB (one-time) ---

async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (localStorage.getItem(LS_KEYS.migrated)) return;
  } catch {
    return;
  }

  const db = await getDB();

  try {
    // Migrate breathing sessions
    const rawBreathing = localStorage.getItem(LS_KEYS.breathingSessions);
    if (rawBreathing) {
      const sessions: BreathingSession[] = JSON.parse(rawBreathing);
      const tx = db.transaction("breathing_sessions", "readwrite");
      for (const s of sessions) {
        await tx.store.put(s);
      }
      await tx.done;
    }

    // Migrate cold sessions
    const rawCold = localStorage.getItem(LS_KEYS.coldSessions);
    if (rawCold) {
      const sessions: ColdSession[] = JSON.parse(rawCold);
      const tx = db.transaction("cold_sessions", "readwrite");
      for (const s of sessions) {
        await tx.store.put(s);
      }
      await tx.done;
    }

    // Migrate preferences
    const rawPrefs = localStorage.getItem(LS_KEYS.preferences);
    if (rawPrefs) {
      const prefs: UserPreferences = JSON.parse(rawPrefs);
      await db.put("preferences", prefs, "user");
    }

    // Mark migration complete
    localStorage.setItem(LS_KEYS.migrated, "1");
  } catch {
    // Migration failed — data remains in localStorage for next attempt
  }
}

// --- Validation helpers ---

const VALID_PACES = new Set(["slow", "medium", "fast"]);
const VALID_COLD_TYPES = new Set(["shower", "bath", "outdoor", "other"]);

function isValidBreathingSession(s: unknown): s is BreathingSession {
  if (s == null || typeof s !== "object") return false;
  const r = s as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.date === "string" &&
    typeof r.rounds === "number" &&
    Array.isArray(r.retentionTimes) &&
    r.retentionTimes.every((t: unknown) => typeof t === "number") &&
    typeof r.totalDuration === "number" &&
    typeof r.breathsPerRound === "number" &&
    VALID_PACES.has(r.pace as string)
  );
}

function isValidColdSession(s: unknown): s is ColdSession {
  if (s == null || typeof s !== "object") return false;
  const r = s as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.date === "string" &&
    typeof r.duration === "number" &&
    typeof r.targetDuration === "number" &&
    VALID_COLD_TYPES.has(r.type as string)
  );
}

// --- Initialization: load IndexedDB data into cache ---

async function loadCache(): Promise<void> {
  if (typeof window === "undefined") return;

  await migrateFromLocalStorage();

  const db = await getDB();

  const [rawBreathing, rawCold, prefs] = await Promise.all([
    db.getAll("breathing_sessions"),
    db.getAll("cold_sessions"),
    db.get("preferences", "user"),
  ]);

  cache.breathingSessions = rawBreathing.filter(isValidBreathingSession);
  cache.coldSessions = rawCold.filter(isValidColdSession);
  cache.preferences = prefs
    ? { ...DEFAULT_PREFERENCES, ...prefs }
    : { ...DEFAULT_PREFERENCES };

  initialized = true;
}

/** Initialize the storage layer. Call once at app startup. */
export function initStorage(): Promise<void> {
  if (initialized) return Promise.resolve();
  if (!initPromise) {
    initPromise = loadCache();
  }
  return initPromise;
}

/** Returns true if the cache has been loaded from IndexedDB. */
export function isStorageReady(): boolean {
  return initialized;
}

// --- Breathing sessions ---

export function getBreathingSessions(): BreathingSession[] {
  return cache.breathingSessions;
}

export function saveBreathingSession(session: BreathingSession): void {
  cache.breathingSessions.push(session);
  // Persist async — fire and forget
  getDB().then((db) => db.put("breathing_sessions", session));
}

// --- Cold sessions ---

export function getColdSessions(): ColdSession[] {
  return cache.coldSessions;
}

export function saveColdSession(session: ColdSession): void {
  cache.coldSessions.push(session);
  getDB().then((db) => db.put("cold_sessions", session));
}

// --- User preferences ---

export function getPreferences(): UserPreferences {
  return cache.preferences;
}

export function savePreferences(prefs: Partial<UserPreferences>): void {
  cache.preferences = { ...cache.preferences, ...prefs };
  getDB().then((db) => db.put("preferences", cache.preferences, "user"));
}

// --- Program progress (re-exported from lib/programStorage.ts) ---

export {
  type ProgramProgress,
  getProgramProgress,
  getAllProgramProgress,
  saveProgramProgress,
  deleteProgramProgress,
} from "./programStorage";

// --- Clear all data ---

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear("breathing_sessions"),
    db.clear("cold_sessions"),
    db.clear("preferences"),
    db.clear("program_progress"),
    db.clear("custom_presets"),
    db.clear("milestones"),
  ]);
  cache.breathingSessions = [];
  cache.coldSessions = [];
  cache.preferences = { ...DEFAULT_PREFERENCES };
}

// --- Theme ---

/** Apply the dark class to <html> based on themeMode and persist for FOUC script. */
export function applyTheme(mode: "system" | "light" | "dark"): void {
  if (typeof window === "undefined") return;
  const prefersDark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", prefersDark);
  try {
    localStorage.setItem("whm_theme", mode);
  } catch {
    // localStorage unavailable — inline script won't benefit but app still works
  }
}

// --- Utility ---

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
