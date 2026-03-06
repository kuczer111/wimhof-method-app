import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  calculateStreak,
  formatSeconds,
  startOfWeek,
  safeAvgRetention,
} from '@/lib/analytics';
import type { BreathingSession } from '@/lib/storage';

function makeSessions(dateStrings: string[]) {
  return dateStrings.map((d) => ({ date: d }));
}

describe('calculateStreak', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 0 for empty sessions', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 1 when only today has a session', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(calculateStreak(makeSessions([today]))).toBe(1);
  });

  it('counts consecutive days ending today', () => {
    const days = Array.from({ length: 5 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    expect(calculateStreak(makeSessions(days))).toBe(5);
  });

  it('counts streak starting from yesterday', () => {
    const days = Array.from({ length: 3 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 1 - i);
      return d.toISOString().split('T')[0];
    });
    expect(calculateStreak(makeSessions(days))).toBe(3);
  });

  it('returns 0 when most recent session is 2+ days ago', () => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    expect(calculateStreak(makeSessions([d.toISOString().split('T')[0]]))).toBe(
      0,
    );
  });

  it('breaks streak on gap', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const sessions = makeSessions([
      today.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      threeDaysAgo.toISOString().split('T')[0],
    ]);
    expect(calculateStreak(sessions)).toBe(2);
  });

  it('deduplicates multiple sessions on the same day', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(
      calculateStreak(makeSessions([today, today, today])),
    ).toBe(1);
  });
});

describe('formatSeconds', () => {
  it('formats seconds only', () => {
    expect(formatSeconds(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatSeconds(90)).toBe('1m 30s');
  });

  it('formats exact minutes', () => {
    expect(formatSeconds(120)).toBe('2m');
  });
});

describe('safeAvgRetention', () => {
  function makeSession(retentionTimes: number[]): BreathingSession {
    return {
      id: '1',
      date: '2025-01-01T12:00:00Z',
      rounds: retentionTimes.length,
      retentionTimes,
      totalDuration: 300,
      breathsPerRound: 30,
      pace: 'medium',
    };
  }

  it('returns 0 for empty sessions', () => {
    expect(safeAvgRetention([])).toBe(0);
  });

  it('returns the average of a single session with one round', () => {
    expect(safeAvgRetention([makeSession([60])])).toBe(60);
  });

  it('averages retention times within a session then across sessions', () => {
    const s1 = makeSession([60, 80]); // avg = 70
    const s2 = makeSession([100, 120]); // avg = 110
    expect(safeAvgRetention([s1, s2])).toBe(90); // (70 + 110) / 2
  });

  it('handles a session with empty retentionTimes', () => {
    const s1 = makeSession([]); // avg = 0
    const s2 = makeSession([100]); // avg = 100
    expect(safeAvgRetention([s1, s2])).toBe(50); // (0 + 100) / 2
  });

  it('handles all sessions with empty retentionTimes', () => {
    expect(safeAvgRetention([makeSession([]), makeSession([])])).toBe(0);
  });
});

describe('startOfWeek', () => {
  it('returns Monday for a Wednesday', () => {
    // Use a Wednesday in local time
    const wed = new Date(2025, 0, 8, 12, 0, 0); // Jan 8 2025 = Wednesday
    const monday = startOfWeek(wed);
    expect(monday.getDay()).toBe(1); // Monday
    expect(monday.getFullYear()).toBe(2025);
    expect(monday.getMonth()).toBe(0);
    expect(monday.getDate()).toBe(6);
  });

  it('returns Monday for a Sunday', () => {
    const sun = new Date(2025, 0, 12, 12, 0, 0); // Jan 12 2025 = Sunday
    const monday = startOfWeek(sun);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(6);
  });

  it('returns the same day for a Monday', () => {
    const mon = new Date(2025, 0, 6, 15, 30, 0); // Jan 6 2025 = Monday
    const result = startOfWeek(mon);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('resets time to midnight', () => {
    const wed = new Date(2025, 0, 8, 23, 59, 59);
    const result = startOfWeek(wed);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('does not mutate the original date', () => {
    const original = new Date(2025, 0, 8, 12, 0, 0);
    const originalTime = original.getTime();
    startOfWeek(original);
    expect(original.getTime()).toBe(originalTime);
  });
});
