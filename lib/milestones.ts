import { getDB } from "./db";
import {
  getBreathingSessions,
  getColdSessions,
  type BreathingSession,
  type ColdSession,
} from "./storage";
import { calculateStreak } from "./analytics";

// --- Types ---

export type MilestoneType =
  | "retention_2min"
  | "cold_3min"
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "new_pb"
  | "program_complete";

export interface Milestone {
  id: string;
  type: MilestoneType;
  achievedAt: string;
  data?: Record<string, unknown>;
}

export interface MilestoneDefinition {
  type: MilestoneType;
  title: string;
  description: string;
  icon: string;
}

export const MILESTONE_DEFINITIONS: Record<MilestoneType, MilestoneDefinition> = {
  retention_2min: {
    type: "retention_2min",
    title: "Deep Diver",
    description: "Held your breath for over 2 minutes",
    icon: "lungs",
  },
  cold_3min: {
    type: "cold_3min",
    title: "Ice Warrior",
    description: "Completed 3+ minutes of cold exposure",
    icon: "snowflake",
  },
  streak_7: {
    type: "streak_7",
    title: "One Week Strong",
    description: "Practiced 7 days in a row",
    icon: "fire",
  },
  streak_30: {
    type: "streak_30",
    title: "Monthly Master",
    description: "Practiced 30 days in a row",
    icon: "calendar",
  },
  streak_100: {
    type: "streak_100",
    title: "Century Club",
    description: "Practiced 100 days in a row",
    icon: "trophy",
  },
  new_pb: {
    type: "new_pb",
    title: "Personal Best!",
    description: "Set a new retention record",
    icon: "medal",
  },
  program_complete: {
    type: "program_complete",
    title: "Program Graduate",
    description: "Completed a training program",
    icon: "graduation",
  },
};

// --- Milestone storage ---

let milestoneCache: Milestone[] | null = null;

async function ensureCache(): Promise<Milestone[]> {
  if (milestoneCache) return milestoneCache;
  const db = await getDB();
  milestoneCache = (await db.getAll("milestones")) as Milestone[];
  return milestoneCache;
}

export async function getUnlockedMilestones(): Promise<Milestone[]> {
  return ensureCache();
}

export async function isMilestoneUnlocked(type: MilestoneType): Promise<boolean> {
  const milestones = await ensureCache();
  return milestones.some((m) => m.type === type);
}

const REPEATABLE_MILESTONES = new Set<MilestoneType>(["new_pb"]);

async function unlockMilestone(
  type: MilestoneType,
  data?: Record<string, unknown>
): Promise<Milestone | null> {
  if (!REPEATABLE_MILESTONES.has(type)) {
    const already = await isMilestoneUnlocked(type);
    if (already) return null;
  }

  const milestone: Milestone = {
    id: `${type}-${Date.now()}`,
    type,
    achievedAt: new Date().toISOString(),
    data,
  };

  const db = await getDB();
  await db.put("milestones", milestone);
  milestoneCache = milestoneCache ? [...milestoneCache, milestone] : [milestone];

  return milestone;
}

// --- Detection: called after saving a session ---

// Pending milestones queue for the toast to consume
const pendingMilestones: Milestone[] = [];
let listeners: Array<() => void> = [];

export function subscribeMilestones(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function consumePendingMilestone(): Milestone | null {
  if (pendingMilestones.length === 0) return null;
  return pendingMilestones.shift() ?? null;
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export async function checkBreathingMilestones(
  session: BreathingSession
): Promise<void> {
  const newMilestones: Milestone[] = [];

  // Check retention over 2 minutes (120 seconds)
  const maxRetention = Math.max(...session.retentionTimes);
  if (maxRetention >= 120) {
    const m = await unlockMilestone("retention_2min", {
      seconds: maxRetention,
    });
    if (m) newMilestones.push(m);
  }

  // Check new personal best
  const allSessions = getBreathingSessions();
  // Exclude the current session (it's already saved by the time this runs)
  const previousSessions = allSessions.filter((s) => s.id !== session.id);
  const previousBest = previousSessions.reduce((best, s) => {
    const sessionMax = Math.max(...s.retentionTimes);
    return sessionMax > best ? sessionMax : best;
  }, 0);

  if (maxRetention > previousBest && previousBest > 0) {
    const m = await unlockMilestone("new_pb", {
      seconds: maxRetention,
      previousBest,
    });
    if (m) newMilestones.push(m);
  }

  // Check streaks (combine breathing + cold dates)
  await checkStreakMilestones(newMilestones);

  if (newMilestones.length > 0) {
    pendingMilestones.push(...newMilestones);
    notifyListeners();
  }
}

export async function checkColdMilestones(session: ColdSession): Promise<void> {
  const newMilestones: Milestone[] = [];

  // Check cold exposure over 3 minutes (180 seconds)
  if (session.duration >= 180) {
    const m = await unlockMilestone("cold_3min", {
      seconds: session.duration,
    });
    if (m) newMilestones.push(m);
  }

  // Check streaks
  await checkStreakMilestones(newMilestones);

  if (newMilestones.length > 0) {
    pendingMilestones.push(...newMilestones);
    notifyListeners();
  }
}

export async function checkProgramMilestone(programId: string): Promise<void> {
  const m = await unlockMilestone("program_complete", { programId });
  if (m) {
    pendingMilestones.push(m);
    notifyListeners();
  }
}

async function checkStreakMilestones(
  newMilestones: Milestone[]
): Promise<void> {
  const breathingSessions = getBreathingSessions();
  const coldSessions = getColdSessions();

  // Combine all session dates
  const allDates = [
    ...breathingSessions.map((s) => ({ date: s.date })),
    ...coldSessions.map((s) => ({ date: s.date })),
  ];

  const streak = calculateStreak(allDates);

  if (streak >= 7) {
    const m = await unlockMilestone("streak_7");
    if (m) newMilestones.push(m);
  }
  if (streak >= 30) {
    const m = await unlockMilestone("streak_30");
    if (m) newMilestones.push(m);
  }
  if (streak >= 100) {
    const m = await unlockMilestone("streak_100");
    if (m) newMilestones.push(m);
  }
}
