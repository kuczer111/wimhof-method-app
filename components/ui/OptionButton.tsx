export default function OptionButton({
  selected,
  onClick,
  children,
  className,
  size = "md",
  "aria-label": ariaLabel,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
  "aria-label"?: string;
}) {
  const sizeClasses = size === "sm" ? "rounded-lg px-3 py-1.5 text-xs" : "rounded-xl px-4 py-2.5 text-sm";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`${sizeClasses} font-medium transition-colors ${
        selected
          ? "bg-brand text-white"
          : "bg-on-surface-light/10 text-on-surface-light-muted active:bg-on-surface-light/15 dark:bg-surface-overlay dark:text-on-surface-muted dark:active:bg-on-surface-faint"
      }${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}
