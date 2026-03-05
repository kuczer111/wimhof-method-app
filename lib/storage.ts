// Typed localStorage helpers for the Wim Hof Method app

// --- Types ---

export interface BreathingSession {
  id: string;
  date: string; // ISO 8601
  rounds: number;
  retentionTimes: number[]; // seconds per round
  totalDuration: number; // seconds
  breathsPerRound: number;
  pace: "slow" | "medium" | "fast";
  feelingRating?: number; // 1–5
  note?: string;
}

export interface ColdSession {
  id: string;
  date: string; // ISO 8601
  duration: number; // seconds
  targetDuration: number; // seconds
  type: "shower" | "bath" | "outdoor" | "other";
  temperature?: number; // celsius, optional
  rating?: number; // 1–5
}

export interface UserPreferences {
  defaultRounds: number; // 1–5, default 3
  defaultBreathCount: 20 | 30 | 40;
  defaultPace: "slow" | "medium" | "fast";
  defaultColdTarget: number; // seconds
  audioMode: "voice" | "tone" | "silent";
  muted: boolean;
  safetyAcknowledged: boolean;
  onboardingComplete: boolean;
}

// --- Storage keys ---

const KEYS = {
  breathingSessions: "whm_breathing_sessions",
  coldSessions: "whm_cold_sessions",
  preferences: "whm_preferences",
} as const;

// --- Default preferences ---

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultRounds: 3,
  defaultBreathCount: 30,
  defaultPace: "medium",
  defaultColdTarget: 60,
  audioMode: "tone",
  muted: false,
  safetyAcknowledged: false,
  onboardingComplete: false,
};

// --- Generic helpers ---

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Breathing sessions ---

export function getBreathingSessions(): BreathingSession[] {
  return readJSON<BreathingSession[]>(KEYS.breathingSessions) ?? [];
}

export function saveBreathingSession(session: BreathingSession): void {
  const sessions = getBreathingSessions();
  sessions.push(session);
  writeJSON(KEYS.breathingSessions, sessions);
}

export function deleteBreathingSession(id: string): void {
  const sessions = getBreathingSessions().filter((s) => s.id !== id);
  writeJSON(KEYS.breathingSessions, sessions);
}

// --- Cold sessions ---

export function getColdSessions(): ColdSession[] {
  return readJSON<ColdSession[]>(KEYS.coldSessions) ?? [];
}

export function saveColdSession(session: ColdSession): void {
  const sessions = getColdSessions();
  sessions.push(session);
  writeJSON(KEYS.coldSessions, sessions);
}

export function deleteColdSession(id: string): void {
  const sessions = getColdSessions().filter((s) => s.id !== id);
  writeJSON(KEYS.coldSessions, sessions);
}

// --- User preferences ---

export function getPreferences(): UserPreferences {
  return readJSON<UserPreferences>(KEYS.preferences) ?? { ...DEFAULT_PREFERENCES };
}

export function savePreferences(prefs: Partial<UserPreferences>): void {
  const current = getPreferences();
  writeJSON(KEYS.preferences, { ...current, ...prefs });
}

// --- Utility ---

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
