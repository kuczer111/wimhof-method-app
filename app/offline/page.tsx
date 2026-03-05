"use client";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">You are offline</h1>
      <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
        Check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-lg bg-sky-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-sky-400"
      >
        Retry
      </button>
    </main>
  );
}
