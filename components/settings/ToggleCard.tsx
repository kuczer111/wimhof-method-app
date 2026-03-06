import Card from '@/components/ui/Card';

interface ToggleCardProps {
  title: string;
  description: string;
  checked: boolean;
  ariaLabel: string;
  onToggle: () => void;
}

export default function ToggleCard({
  title,
  description,
  checked,
  ariaLabel,
  onToggle,
}: ToggleCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
            {title}
          </h2>
          <p className="mt-1 text-xs text-on-surface-light-muted dark:text-on-surface-faint">
            {description}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={ariaLabel}
          onClick={onToggle}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
            checked
              ? 'bg-cold'
              : 'bg-on-surface-light/30 dark:bg-surface-overlay'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </Card>
  );
}
