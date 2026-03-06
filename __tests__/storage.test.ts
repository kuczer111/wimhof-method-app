import { describe, it, expect } from 'vitest';
import {
  normalizeSessionConfig,
  profileToDefaults,
  DEFAULT_SESSION_CONFIG,
} from '../lib/storage';

// We test the exported validation/normalization functions and profileToDefaults.
// The validator functions (isValidBreathingSession, isValidColdSession) are not
// exported, so we test them indirectly via the types and normalizeSessionConfig.

describe('normalizeSessionConfig', () => {
  it('returns defaults for an empty object', () => {
    const result = normalizeSessionConfig({});
    expect(result).toEqual(DEFAULT_SESSION_CONFIG);
  });

  it('preserves valid overrides', () => {
    const result = normalizeSessionConfig({
      rounds: 4,
      breathsPerRound: [40, 40, 40, 40],
      pace: 'fast',
      retentionMode: 'target',
      autoCold: true,
    });
    expect(result).toEqual({
      rounds: 4,
      breathsPerRound: [40, 40, 40, 40],
      pace: 'fast',
      retentionMode: 'target',
      autoCold: true,
    });
  });

  it('migrates breathsPerRound from number to array', () => {
    const result = normalizeSessionConfig({
      rounds: 4,
      breathsPerRound: 40,
    });
    expect(result.breathsPerRound).toEqual([40, 40, 40, 40]);
  });

  it('uses default rounds when breathsPerRound is number and rounds is missing', () => {
    const result = normalizeSessionConfig({
      breathsPerRound: 30,
    });
    expect(result.breathsPerRound).toEqual([30, 30, 30]);
    expect(result.rounds).toBe(DEFAULT_SESSION_CONFIG.rounds);
  });

  it('uses default rounds when breathsPerRound is number and rounds is non-numeric', () => {
    const result = normalizeSessionConfig({
      rounds: 'invalid' as unknown,
      breathsPerRound: 20,
    });
    expect(result.breathsPerRound).toEqual([20, 20, 20]);
  });

  it('resets invalid retentionMode to default', () => {
    const result = normalizeSessionConfig({ retentionMode: 'invalid' });
    expect(result.retentionMode).toBe('free');
  });

  it('resets non-boolean autoCold to default', () => {
    const result = normalizeSessionConfig({ autoCold: 'yes' });
    expect(result.autoCold).toBe(false);
  });

  it('accepts retentionMode "target"', () => {
    const result = normalizeSessionConfig({ retentionMode: 'target' });
    expect(result.retentionMode).toBe('target');
  });

  it('accepts autoCold true', () => {
    const result = normalizeSessionConfig({ autoCold: true });
    expect(result.autoCold).toBe(true);
  });

  it('handles mindsetPrompts passthrough', () => {
    const prompts = ['Focus', 'Relax'];
    const result = normalizeSessionConfig({ mindsetPrompts: prompts });
    expect(result.mindsetPrompts).toEqual(prompts);
  });
});

describe('profileToDefaults', () => {
  it('returns beginner defaults', () => {
    const result = profileToDefaults({
      primaryGoal: 'curiosity',
      availableTime: '20',
      experienceLevel: 'beginner',
      preferredSessionTime: 'morning',
    });
    expect(result.defaultRounds).toBe(3);
    expect(result.defaultBreathCount).toBe(30);
    expect(result.defaultPace).toBe('slow');
    expect(result.defaultColdTarget).toBe(30);
    expect(result.profileComplete).toBe(true);
  });

  it('returns regular experience defaults', () => {
    const result = profileToDefaults({
      primaryGoal: 'curiosity',
      availableTime: '20',
      experienceLevel: 'regular',
      preferredSessionTime: 'evening',
    });
    expect(result.defaultRounds).toBe(4);
    expect(result.defaultBreathCount).toBe(40);
    expect(result.defaultPace).toBe('medium');
    expect(result.defaultColdTarget).toBe(120);
  });

  it('returns "some" experience defaults (no adjustment)', () => {
    const result = profileToDefaults({
      primaryGoal: 'curiosity',
      availableTime: '20',
      experienceLevel: 'some',
      preferredSessionTime: 'midday',
    });
    expect(result.defaultRounds).toBe(3);
    expect(result.defaultBreathCount).toBe(30);
    expect(result.defaultPace).toBe('medium');
    expect(result.defaultColdTarget).toBe(60);
  });

  it('applies athletic goal tweaks', () => {
    const result = profileToDefaults({
      primaryGoal: 'athletic',
      availableTime: '20',
      experienceLevel: 'some',
      preferredSessionTime: 'morning',
    });
    expect(result.defaultRounds).toBe(4); // 3 + 1
    expect(result.defaultBreathCount).toBe(40);
  });

  it('caps rounds at 5 for athletic + regular', () => {
    const result = profileToDefaults({
      primaryGoal: 'athletic',
      availableTime: '30+',
      experienceLevel: 'regular',
      preferredSessionTime: 'morning',
    });
    // regular: 4, athletic: +1 = 5, 30+: +1 = 6 capped to 5
    expect(result.defaultRounds).toBe(5);
  });

  it('applies cold goal tweaks', () => {
    const result = profileToDefaults({
      primaryGoal: 'cold',
      availableTime: '20',
      experienceLevel: 'some',
      preferredSessionTime: 'morning',
    });
    expect(result.defaultColdTarget).toBe(120); // 60 + 60
  });

  it('caps cold target at 180 for cold + regular', () => {
    const result = profileToDefaults({
      primaryGoal: 'cold',
      availableTime: '20',
      experienceLevel: 'regular',
      preferredSessionTime: 'morning',
    });
    // regular: 120, cold: +60 = 180 (at cap)
    expect(result.defaultColdTarget).toBe(180);
  });

  it('applies stress goal tweaks', () => {
    const result = profileToDefaults({
      primaryGoal: 'stress',
      availableTime: '20',
      experienceLevel: 'regular',
      preferredSessionTime: 'morning',
    });
    expect(result.defaultPace).toBe('slow');
  });

  it('applies 10-minute time budget constraint', () => {
    const result = profileToDefaults({
      primaryGoal: 'athletic',
      availableTime: '10',
      experienceLevel: 'regular',
      preferredSessionTime: 'morning',
    });
    // regular: 4, athletic: +1 = 5, then capped to 3 by 10-min budget
    expect(result.defaultRounds).toBe(3);
  });

  it('applies 30+ time budget bonus', () => {
    const result = profileToDefaults({
      primaryGoal: 'curiosity',
      availableTime: '30+',
      experienceLevel: 'some',
      preferredSessionTime: 'morning',
    });
    // some: 3, 30+: +1 = 4
    expect(result.defaultRounds).toBe(4);
  });

  it('passes through profile fields', () => {
    const result = profileToDefaults({
      primaryGoal: 'immune',
      availableTime: '20',
      experienceLevel: 'beginner',
      preferredSessionTime: 'evening',
    });
    expect(result.primaryGoal).toBe('immune');
    expect(result.availableTime).toBe('20');
    expect(result.experienceLevel).toBe('beginner');
    expect(result.preferredSessionTime).toBe('evening');
  });
});
