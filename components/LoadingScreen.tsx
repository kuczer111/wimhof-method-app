export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-surface-base">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/30 border-t-brand dark:border-brand-dark/40 dark:border-t-brand-light" />
        <p className="text-sm text-on-surface-light-muted dark:text-on-surface-faint">Loading...</p>
      </div>
    </div>
  );
}
