// Screen Wake Lock API utility
// Prevents screen from dimming during active sessions.

let sentinel: WakeLockSentinel | null = null;

/** Request a screen wake lock. No-op if unsupported or already held. */
export async function requestWakeLock(): Promise<void> {
  if (sentinel) return;
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch {
    // Wake lock request can fail (e.g. tab not visible)
    sentinel = null;
  }
}

/** Release the current wake lock if held. */
export async function releaseWakeLock(): Promise<void> {
  if (!sentinel) return;
  try {
    await sentinel.release();
  } catch {
    // Already released
  }
  sentinel = null;
}
