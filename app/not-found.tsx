import Link from 'next/link';
import AppShell from '@/components/AppShell';

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-6xl font-bold text-brand dark:text-brand-light">
          404
        </h1>
        <p className="mt-4 text-lg text-on-surface-muted dark:text-on-surface-faint">
          Page not found
        </p>
        <Link
          href="/"
          className="mt-8 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark dark:bg-brand-light dark:text-surface-base dark:hover:bg-brand"
        >
          Back to Home
        </Link>
      </div>
    </AppShell>
  );
}
