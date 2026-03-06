'use client';

import { strings } from '@/lib/i18n';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">
        {strings.offline.heading}
      </h1>
      <p className="mt-4 text-lg text-on-surface-light-muted dark:text-on-surface-muted">
        {strings.offline.description}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-lg bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-light"
      >
        {strings.offline.retry}
      </button>
    </main>
  );
}
