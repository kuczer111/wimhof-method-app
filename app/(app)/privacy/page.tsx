import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-[var(--nav-height)] pt-12">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>

      <section className="flex flex-col gap-2 text-sm text-on-surface-light-muted dark:text-on-surface-muted">
        <h2 className="text-base font-semibold text-on-surface-light dark:text-on-surface">
          Your data stays on your device
        </h2>
        <p>
          This app stores all data locally on your device using IndexedDB and
          localStorage. No data is sent to any server, and there are no user
          accounts or cloud syncing.
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm text-on-surface-light-muted dark:text-on-surface-muted">
        <h2 className="text-base font-semibold text-on-surface-light dark:text-on-surface">
          What data is stored
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Breathing session history (rounds, retention times, dates)</li>
          <li>
            Cold exposure session history (duration, temperature, feeling
            ratings)
          </li>
          <li>
            Your preferences and settings (pace, rounds, temperature unit, audio
            mode)
          </li>
          <li>Practice profile (experience level, goals, available time)</li>
          <li>Custom breathing presets</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2 text-sm text-on-surface-light-muted dark:text-on-surface-muted">
        <h2 className="text-base font-semibold text-on-surface-light dark:text-on-surface">
          No analytics or tracking
        </h2>
        <p>
          This app does not use any analytics, tracking pixels, or third-party
          scripts. No personal information is collected or shared.
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm text-on-surface-light-muted dark:text-on-surface-muted">
        <h2 className="text-base font-semibold text-on-surface-light dark:text-on-surface">
          How to delete your data
        </h2>
        <p>
          You can delete all stored data at any time from the{' '}
          <Link
            href="/settings"
            className="font-medium text-brand underline dark:text-brand-light"
          >
            Settings
          </Link>{' '}
          page using the &quot;Clear All Data&quot; option. Alternatively,
          clearing your browser or app data will remove everything.
        </p>
      </section>

      <div className="pt-2">
        <Link
          href="/settings"
          className="text-sm font-medium text-brand underline dark:text-brand-light"
        >
          Back to Settings
        </Link>
      </div>
    </div>
  );
}
