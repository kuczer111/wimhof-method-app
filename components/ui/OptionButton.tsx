export default function OptionButton({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
        selected
          ? "bg-sky-500 text-white"
          : "bg-gray-200 text-gray-600 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:active:bg-gray-700"
      }${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}
