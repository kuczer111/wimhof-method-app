import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// --- IndexedDB Schema ---

export interface WhmDB extends DBSchema {
  breathing_sessions: {
    key: string;
    value: {
      id: string;
      date: string;
      rounds: number;
      retentionTimes: number[];
      totalDuration: number;
      breathsPerRound: number;
      pace: "slow" | "medium" | "fast";
      feelingRating?: number;
      note?: string;
    };
    indexes: { "by-date": string };
  };
  cold_sessions: {
    key: string;
    value: {
      id: string;
      date: string;
      duration: number;
      targetDuration: number;
      type: "shower" | "bath" | "outdoor" | "other";
      temperature?: number;
      rating?: number;
    };
    indexes: { "by-date": string };
  };
  preferences: {
    key: string;
    value: unknown;
  };
  program_progress: {
    key: string;
    value: {
      programId: string;
      startDate: string;
      completedDays: number[];
      paused: boolean;
      pausedDate?: string;
    };
  };
  custom_presets: {
    key: string;
    value: {
      id: string;
      name: string;
      rounds: number;
      breathsPerRound: number;
      pace: "slow" | "medium" | "fast";
    };
  };
  milestones: {
    key: string;
    value: {
      id: string;
      type: string;
      achievedAt: string;
      data?: unknown;
    };
    indexes: { "by-type": string };
  };
}

const DB_NAME = "whm-app";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WhmDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<WhmDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB not available on server"));
  }

  if (!dbPromise) {
    dbPromise = openDB<WhmDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // breathing_sessions
        const breathingStore = db.createObjectStore("breathing_sessions", {
          keyPath: "id",
        });
        breathingStore.createIndex("by-date", "date");

        // cold_sessions
        const coldStore = db.createObjectStore("cold_sessions", {
          keyPath: "id",
        });
        coldStore.createIndex("by-date", "date");

        // preferences (key-value store)
        db.createObjectStore("preferences");

        // program_progress
        db.createObjectStore("program_progress", { keyPath: "programId" });

        // custom_presets
        db.createObjectStore("custom_presets", { keyPath: "id" });

        // milestones
        const milestoneStore = db.createObjectStore("milestones", {
          keyPath: "id",
        });
        milestoneStore.createIndex("by-type", "type");
      },
    });
  }

  return dbPromise;
}
