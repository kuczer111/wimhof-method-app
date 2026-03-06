// Web Audio API engine for breathing session tones
// Generates inhale/exhale tones, hold chimes, and countdown beeps.
// Respects the muted preference from storage.

import { getPreferences, savePreferences } from './storage';

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

// --- Audio mode helpers ---

export type AudioMode = 'voice' | 'tone' | 'silent' | 'haptic';

function getAudioMode(): AudioMode {
  return getPreferences().audioMode;
}

function isHaptic(): boolean {
  return getAudioMode() === 'haptic';
}

// --- Mute toggle ---

export function isMuted(): boolean {
  const mode = getAudioMode();
  return getPreferences().muted || mode === 'silent' || mode === 'haptic';
}

export function setMuted(muted: boolean): void {
  savePreferences({ muted });
}

export function toggleMute(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

// --- Tone primitives ---

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue = 0.3,
): void {
  if (isMuted()) return;

  const ac = getContext();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(gainValue, ac.currentTime);
  // Fade out to avoid click
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

function playChime(frequencies: number[], duration: number): void {
  if (isMuted()) return;

  const ac = getContext();
  const masterGain = ac.createGain();
  masterGain.gain.setValueAtTime(0.25, ac.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(
    0.001,
    ac.currentTime + duration,
  );
  masterGain.connect(ac.destination);

  for (const freq of frequencies) {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(masterGain);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  }
}

// --- Haptic vibration patterns ---

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/** Two short pulses — rising feel for inhale */
export function vibrateInhale(): void {
  vibrate([80, 40, 80]);
}

/** Single long pulse — falling feel for exhale */
export function vibrateExhale(): void {
  vibrate(200);
}

/** Three quick pulses — hold start */
export function vibrateHoldStart(): void {
  vibrate([50, 30, 50, 30, 50]);
}

/** Long sustained buzz — hold end */
export function vibrateHoldEnd(): void {
  vibrate(400);
}

/** Short tap — countdown beep equivalent */
export function vibrateCountdown(): void {
  vibrate(60);
}

/** Double tap — final countdown */
export function vibrateCountdownFinal(): void {
  vibrate([100, 50, 100]);
}

// --- Public sound API ---

/** Rising tone for inhale phase (C5 → E5 sweep, 0.4s) */
export function playInhaleTone(): void {
  if (isHaptic()) {
    vibrateInhale();
    return;
  }
  if (isMuted()) return;

  const ac = getContext();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, ac.currentTime); // C5
  osc.frequency.linearRampToValueAtTime(659.25, ac.currentTime + 0.4); // E5
  gain.gain.setValueAtTime(0.3, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.45);
}

/** Falling tone for exhale phase (E5 → C5 sweep, 0.4s) */
export function playExhaleTone(): void {
  if (isHaptic()) {
    vibrateExhale();
    return;
  }
  if (isMuted()) return;

  const ac = getContext();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(659.25, ac.currentTime); // E5
  osc.frequency.linearRampToValueAtTime(523.25, ac.currentTime + 0.4); // C5
  gain.gain.setValueAtTime(0.3, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.45);
}

/** Bright chime signaling the start of retention hold (C5+E5+G5 chord, 0.8s) */
export function playHoldStartChime(): void {
  if (isHaptic()) {
    vibrateHoldStart();
    return;
  }
  playChime([523.25, 659.25, 783.99], 0.8);
}

/** Warm resolved chime signaling end of retention hold (C4+E4+G4+C5, 1s) */
export function playHoldEndChime(): void {
  if (isHaptic()) {
    vibrateHoldEnd();
    return;
  }
  playChime([261.63, 329.63, 392.0, 523.25], 1.0);
}

/** Short beep for countdown (last seconds of recovery breath) */
export function playCountdownBeep(): void {
  if (isHaptic()) {
    vibrateCountdown();
    return;
  }
  playTone(880, 0.12, 'sine', 0.25);
}

/** Final beep — slightly lower and longer */
export function playCountdownFinalBeep(): void {
  if (isHaptic()) {
    vibrateCountdownFinal();
    return;
  }
  playTone(440, 0.25, 'sine', 0.35);
}

// --- Lifecycle ---

/** Call once on user gesture to unlock AudioContext on iOS */
export function unlockAudio(): void {
  const ac = getContext();
  // Play a silent buffer to unlock
  const buffer = ac.createBuffer(1, 1, ac.sampleRate);
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.connect(ac.destination);
  source.start(0);
}

/** Clean up the AudioContext when no longer needed */
export function disposeAudio(): void {
  if (ctx && ctx.state !== 'closed') {
    ctx.close();
    ctx = null;
  }
}
