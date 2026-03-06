import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BreathingSession, ColdSession } from '@/lib/storage';

// --- Mock IndexedDB via lib/db ---

const mockStore = new Map<string, unknown>();

vi.mock('@/lib/db', () => ({
  getDB: vi.fn().mockResolvedValue({
    getAll: vi.fn((store: string) => {
      const all: unknown[] = [];
      for (const [key, val] of Array.from(mockStore.entries())) {
        if (key.startsWith(`${store}:`)) all.push(val);
      }
      return Promise.resolve(all);
    }),
    put: vi.fn((store: string, value: { id?: string }) => {
      const key = `${store}:${value.id ?? Date.now()}`;
      mockStore.set(key, value);
      return Promise.resolve();
    }),
  }),
}));

// --- Mock storage for session retrieval ---

let mockBreathingSessions: BreathingSession[] = [];
let mockColdSessions: ColdSession[] = [];

vi.mock('@/lib/storage', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getBreathingSessions: () => mockBreathingSessions,
    getColdSessions: () => mockColdSessions,
  };
});

// Import AFTER mocks are set up
import {
  MILESTONE_DEFINITIONS,
  checkBreathingMilestones,
  checkColdMilestones,
  checkProgramMilestone,
  consumePendingMilestone,
  subscribeMilestones,
  type MilestoneType,
} from '@/lib/milestones';

// --- Helpers ---

function makeBreathingSession(
  overrides: Partial<BreathingSession> = {},
): BreathingSession {
  return {
    id: `b-${Date.now()}-${Math.random()}`,
    date: new Date().toISOString(),
    rounds: 3,
    retentionTimes: [60, 70, 80],
    totalDuration: 600,
    breathsPerRound: 30,
    pace: 'medium',
    ...overrides,
  };
}

function makeColdSession(
  overrides: Partial<ColdSession> = {},
): ColdSession {
  return {
    id: `c-${Date.now()}-${Math.random()}`,
    date: new Date().toISOString(),
    duration: 60,
    targetDuration: 120,
    type: 'shower',
    ...overrides,
  };
}

function drainPending() {
  const milestones = [];
  let m = consumePendingMilestone();
  while (m) {
    milestones.push(m);
    m = consumePendingMilestone();
  }
  return milestones;
}

// --- Tests ---

describe('MILESTONE_DEFINITIONS', () => {
  it('has definitions for all milestone types', () => {
    const types: MilestoneType[] = [
      'retention_2min',
      'cold_3min',
      'streak_7',
      'streak_30',
      'streak_100',
      'new_pb',
      'program_complete',
    ];
    for (const type of types) {
      expect(MILESTONE_DEFINITIONS[type]).toBeDefined();
      expect(MILESTONE_DEFINITIONS[type].title).toBeTruthy();
      expect(MILESTONE_DEFINITIONS[type].icon).toBeTruthy();
    }
  });
});

describe('consumePendingMilestone', () => {
  beforeEach(() => {
    drainPending();
    mockStore.clear();
    mockBreathingSessions = [];
    mockColdSessions = [];
  });

  it('returns null when no pending milestones', () => {
    expect(consumePendingMilestone()).toBeNull();
  });
});

describe('subscribeMilestones', () => {
  beforeEach(() => {
    drainPending();
    mockStore.clear();
    mockBreathingSessions = [];
    mockColdSessions = [];
  });

  it('returns an unsubscribe function', () => {
    const listener = vi.fn();
    const unsub = subscribeMilestones(listener);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('notifies listeners when a milestone is unlocked', async () => {
    const listener = vi.fn();
    const unsub = subscribeMilestones(listener);

    // Use new_pb (repeatable) to test listener notification
    const prev = makeBreathingSession({ id: 'sub-prev', retentionTimes: [30] });
    const current = makeBreathingSession({
      id: 'sub-curr',
      retentionTimes: [50],
    });
    mockBreathingSessions = [prev, current];
    await checkBreathingMilestones(current);

    expect(listener).toHaveBeenCalled();
    unsub();
    drainPending();
  });

  it('stops notifying after unsubscribe', async () => {
    const listener = vi.fn();
    const unsub = subscribeMilestones(listener);
    unsub();

    const prev = makeBreathingSession({ id: 'sub2-prev', retentionTimes: [30] });
    const current = makeBreathingSession({
      id: 'sub2-curr',
      retentionTimes: [55],
    });
    mockBreathingSessions = [prev, current];
    await checkBreathingMilestones(current);

    expect(listener).not.toHaveBeenCalled();
    drainPending();
  });
});

describe('checkBreathingMilestones', () => {
  beforeEach(() => {
    drainPending();
    mockStore.clear();
    mockBreathingSessions = [];
    mockColdSessions = [];
  });

  it('unlocks retention_2min when retention >= 120s', async () => {
    const session = makeBreathingSession({ retentionTimes: [125] });
    mockBreathingSessions = [session];
    await checkBreathingMilestones(session);

    const pending = drainPending();
    expect(pending.some((m) => m.type === 'retention_2min')).toBe(true);
  });

  it('does not unlock retention_2min when retention < 120s', async () => {
    const session = makeBreathingSession({ retentionTimes: [90, 100] });
    mockBreathingSessions = [session];
    await checkBreathingMilestones(session);

    const pending = drainPending();
    expect(pending.some((m) => m.type === 'retention_2min')).toBe(false);
  });

  it('does not re-unlock retention_2min (non-repeatable)', async () => {
    const s1 = makeBreathingSession({ id: 's1', retentionTimes: [130] });
    mockBreathingSessions = [s1];
    await checkBreathingMilestones(s1);
    drainPending();

    const s2 = makeBreathingSession({ id: 's2', retentionTimes: [140] });
    mockBreathingSessions = [s1, s2];
    await checkBreathingMilestones(s2);
    const pending = drainPending();

    expect(pending.filter((m) => m.type === 'retention_2min')).toHaveLength(0);
  });

  it('unlocks new_pb when beating previous best', async () => {
    const prev = makeBreathingSession({
      id: 'prev',
      retentionTimes: [60, 70],
    });
    const current = makeBreathingSession({
      id: 'current',
      retentionTimes: [90],
    });
    mockBreathingSessions = [prev, current];

    await checkBreathingMilestones(current);

    const pending = drainPending();
    expect(pending.some((m) => m.type === 'new_pb')).toBe(true);
  });

  it('does not unlock new_pb on first ever session', async () => {
    const session = makeBreathingSession({ retentionTimes: [90] });
    mockBreathingSessions = [session];
    await checkBreathingMilestones(session);

    const pending = drainPending();
    expect(pending.some((m) => m.type === 'new_pb')).toBe(false);
  });

  it('new_pb is repeatable', async () => {
    const s1 = makeBreathingSession({ id: 's1', retentionTimes: [60] });
    const s2 = makeBreathingSession({ id: 's2', retentionTimes: [80] });
    mockBreathingSessions = [s1, s2];
    await checkBreathingMilestones(s2);
    drainPending();

    const s3 = makeBreathingSession({ id: 's3', retentionTimes: [100] });
    mockBreathingSessions = [s1, s2, s3];
    await checkBreathingMilestones(s3);

    const pending = drainPending();
    expect(pending.some((m) => m.type === 'new_pb')).toBe(true);
  });

});

describe('checkColdMilestones', () => {
  beforeEach(() => {
    drainPending();
    mockStore.clear();
    mockBreathingSessions = [];
    mockColdSessions = [];
  });

  it('unlocks cold_3min when duration >= 180s', async () => {
    const session = makeColdSession({ duration: 200 });
    mockColdSessions = [session];
    await checkColdMilestones(session);

    const pending = drainPending();
    expect(pending.some((m) => m.type === 'cold_3min')).toBe(true);
  });

  it('does not unlock cold_3min when duration < 180s', async () => {
    const session = makeColdSession({ duration: 120 });
    mockColdSessions = [session];
    await checkColdMilestones(session);

    const pending = drainPending();
    expect(pending.some((m) => m.type === 'cold_3min')).toBe(false);
  });

  it('does not re-unlock cold_3min (non-repeatable)', async () => {
    const s1 = makeColdSession({ id: 'c1', duration: 200 });
    mockColdSessions = [s1];
    await checkColdMilestones(s1);
    drainPending();

    const s2 = makeColdSession({ id: 'c2', duration: 250 });
    mockColdSessions = [s1, s2];
    await checkColdMilestones(s2);

    const pending = drainPending();
    expect(pending.filter((m) => m.type === 'cold_3min')).toHaveLength(0);
  });
});

describe('checkProgramMilestone', () => {
  beforeEach(() => {
    drainPending();
    mockStore.clear();
    mockBreathingSessions = [];
    mockColdSessions = [];
  });

  it('unlocks program_complete with programId data', async () => {
    await checkProgramMilestone('beginner-week1');

    const pending = drainPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].type).toBe('program_complete');
    expect(pending[0].data?.programId).toBe('beginner-week1');
  });

  it('does not re-unlock program_complete (non-repeatable)', async () => {
    await checkProgramMilestone('beginner-week1');
    drainPending();

    await checkProgramMilestone('beginner-week1');

    const pending = drainPending();
    expect(pending).toHaveLength(0);
  });
});

describe('streak milestones (via checkBreathingMilestones)', () => {
  beforeEach(() => {
    drainPending();
    mockStore.clear();
    mockBreathingSessions = [];
    mockColdSessions = [];
  });

  it('unlocks streak_7 with 7 consecutive days', async () => {
    const sessions: BreathingSession[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      sessions.push(
        makeBreathingSession({
          id: `s${i}`,
          date: d.toISOString(),
          retentionTimes: [50],
        }),
      );
    }
    mockBreathingSessions = sessions;

    const latest = sessions[0];
    await checkBreathingMilestones(latest);

    const pending = drainPending();
    expect(pending.some((m) => m.type === 'streak_7')).toBe(true);
  });

  it('does not unlock streak_7 with only 6 days', async () => {
    const sessions: BreathingSession[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      sessions.push(
        makeBreathingSession({
          id: `s${i}`,
          date: d.toISOString(),
          retentionTimes: [50],
        }),
      );
    }
    mockBreathingSessions = sessions;

    await checkBreathingMilestones(sessions[0]);

    const pending = drainPending();
    expect(pending.some((m) => m.type === 'streak_7')).toBe(false);
  });
});
