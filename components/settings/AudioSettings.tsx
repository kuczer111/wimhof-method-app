import Card from "@/components/ui/Card";
import OptionButton from "@/components/ui/OptionButton";
import type { UserPreferences } from "@/lib/storage";
import { strings } from "@/lib/i18n";

type AudioMode = UserPreferences["audioMode"];

const AUDIO_OPTIONS: { value: AudioMode; label: string }[] = [
  { value: "tone", label: strings.settings.audioOptions.tones },
  { value: "haptic", label: strings.settings.audioOptions.haptic },
  { value: "silent", label: strings.settings.audioOptions.silent },
];

interface AudioSettingsProps {
  audioMode: AudioMode;
  onUpdate: (patch: Partial<UserPreferences>) => void;
}

export default function AudioSettings({ audioMode, onUpdate }: AudioSettingsProps) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {strings.settings.audioMode}
      </h2>
      <div className="flex gap-2">
        {AUDIO_OPTIONS.map((opt) => (
          <OptionButton
            key={opt.value}
            selected={audioMode === opt.value}
            onClick={() => onUpdate({ audioMode: opt.value })}
          >
            {opt.label}
          </OptionButton>
        ))}
      </div>
    </Card>
  );
}
