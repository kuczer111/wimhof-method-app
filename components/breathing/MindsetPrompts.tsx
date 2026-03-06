import Card from "@/components/ui/Card";
import type { SessionConfig } from "@/lib/storage";
import { strings } from "@/lib/i18n";

interface MindsetPromptsProps {
  config: SessionConfig;
  onConfigChange: (config: SessionConfig) => void;
}

export default function MindsetPrompts({ config, onConfigChange }: MindsetPromptsProps) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {strings.breathe.mindsetPrompts}
      </h2>
      <div className="flex flex-col gap-2">
        {Array.from({ length: config.rounds }, (_, i) => (
          <input
            key={i}
            type="text"
            value={config.mindsetPrompts?.[i] ?? ""}
            onChange={(e) => {
              const prompts = Array.from(
                { length: config.rounds },
                (_, j) => config.mindsetPrompts?.[j] ?? ""
              );
              prompts[i] = e.target.value;
              onConfigChange({ ...config, mindsetPrompts: prompts });
            }}
            placeholder={strings.breathe.mindsetPromptPlaceholder(i + 1)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500"
          />
        ))}
      </div>
    </Card>
  );
}
