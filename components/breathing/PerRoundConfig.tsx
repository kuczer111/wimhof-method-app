import OptionButton from "@/components/ui/OptionButton";
import type { SessionConfig } from "@/lib/storage";
import { strings } from "@/lib/i18n";

const BREATH_OPTIONS = [20, 30, 40];

interface PerRoundConfigProps {
  config: SessionConfig;
  onConfigChange: (config: SessionConfig) => void;
}

export default function PerRoundConfig({ config, onConfigChange }: PerRoundConfigProps) {
  if (config.rounds <= 1) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-on-surface-light-muted dark:text-on-surface-muted">
        {strings.breathe.perRoundCustomize}
      </p>
      <div className="flex flex-col gap-2">
        {Array.from({ length: config.rounds }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-8 text-xs font-semibold text-on-surface-light-muted dark:text-on-surface-muted">
              {strings.breathe.roundLabel(i + 1)}
            </span>
            <div className="flex gap-1.5">
              {BREATH_OPTIONS.map((n) => (
                <OptionButton
                  key={n}
                  selected={config.breathsPerRound[i] === n}
                  onClick={() => {
                    const newBreaths = [...config.breathsPerRound];
                    newBreaths[i] = n;
                    onConfigChange({ ...config, breathsPerRound: newBreaths });
                  }}
                  size="sm"
                >
                  {n}
                </OptionButton>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
