import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { trackError } from '@/components/ErrorTracker';
import type {
  BreathingSession,
  ColdSession,
  UserPreferences,
  SessionConfig,
} from './storage';
import type { MilestoneType } from './milestones';

// --- IndexedDB Schema ---

export interface WhmDB extends DBSchema {
  breathing_sessions: {
    key: string;
    value: BreathingSession;
    indexes: { 'by-date': string };
  };
  cold_sessions: {
    key: string;
    value: ColdSession;
    indexes: { 'by-date': string };
  };
  preferences: {
    key: string;
    value: UserPreferences;
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
      config: SessionConfig;
    };
  };
  milestones: {
    key: string;
    value: {
      id: string;
      type: MilestoneType;
      achievedAt: string;
      data?: Record<string, unknown>;
    };
    indexes: { 'by-type': string };
  };
}

const DB_NAME = 'whm-app';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WhmDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<WhmDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available on server'));
  }

  if (!dbPromise) {
    dbPromise = openDB<WhmDB>(DB_NAME, DB_VERSION, {
      blocked() {
        trackError('indexeddb', new Error('Database blocked by older version'));
      },
      upgrade(db) {
        // breathing_sessions
        const breathingStore = db.createObjectStore('breathing_sessions', {
          keyPath: 'id',
        });
        breathingStore.createIndex('by-date', 'date');

        // cold_sessions
        const coldStore = db.createObjectStore('cold_sessions', {
          keyPath: 'id',
        });
        coldStore.createIndex('by-date', 'date');

        // preferences (key-value store)
        db.createObjectStore('preferences');

        // program_progress
        db.createObjectStore('program_progress', { keyPath: 'programId' });

        // custom_presets
        db.createObjectStore('custom_presets', { keyPath: 'id' });

        // milestones
        const milestoneStore = db.createObjectStore('milestones', {
          keyPath: 'id',
        });
        milestoneStore.createIndex('by-type', 'type');
      },
    }).catch((error) => {
      trackError('indexeddb', error, 'Failed to open database');
      throw error;
    });
  }

  return dbPromise;
}
