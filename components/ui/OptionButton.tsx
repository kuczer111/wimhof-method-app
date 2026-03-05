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
          ? "bg-sky-500 text-white"
          : "bg-gray-200 text-gray-600 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:active:bg-gray-700"
      }${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}
