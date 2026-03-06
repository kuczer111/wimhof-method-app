import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { SessionConfig, CustomPreset } from "@/lib/storage";
import { savePreferences, generateId } from "@/lib/storage";
import { strings } from "@/lib/i18n";

interface SavePresetFormProps {
  config: SessionConfig;
  customPresets: CustomPreset[];
  onPresetsChange: (presets: CustomPreset[]) => void;
}

export default function SavePresetForm({ config, customPresets, onPresetsChange }: SavePresetFormProps) {
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function handleSavePreset() {
    const name = presetName.trim();
    if (!name) return;

    if (customPresets.length >= 5) {
      setSaveMessage(strings.breathe.presetLimitReached);
      setTimeout(() => setSaveMessage(null), 2000);
      return;
    }

    const newPreset: CustomPreset = {
      id: generateId(),
      name,
      config: { ...config },
    };
    const updated = [...customPresets, newPreset];
    onPresetsChange(updated);
    savePreferences({ customPresets: updated });
    setPresetName("");
    setShowSavePreset(false);
    setSaveMessage(strings.breathe.presetSaved);
    setTimeout(() => setSaveMessage(null), 2000);
  }

  return (
    <>
      {showSavePreset ? (
        <Card>
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={strings.breathe.presetNamePlaceholder}
              maxLength={30}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePreset();
              }}
            />
            <Button size="sm" onClick={handleSavePreset} disabled={!presetName.trim()}>
              {strings.common.done}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setShowSavePreset(false); setPresetName(""); }}>
              {strings.settings.clearConfirm.cancel}
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => setShowSavePreset(true)}>
          {strings.breathe.saveAsPreset}
        </Button>
      )}

      {saveMessage && (
        <p className="text-center text-sm font-medium text-emerald-500 dark:text-emerald-400">
          {saveMessage}
        </p>
      )}
    </>
  );
}
