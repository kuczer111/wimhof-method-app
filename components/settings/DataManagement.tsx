import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import {
  getBreathingSessions,
  getColdSessions,
  getPreferences,
  clearAllData,
} from '@/lib/storage';
import { strings } from '@/lib/i18n';
import { useState } from 'react';

interface DataManagementProps {
  onDataCleared: () => void;
}

export default function DataManagement({ onDataCleared }: DataManagementProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);

  function handleExportData() {
    const data = {
      breathingSessions: getBreathingSessions(),
      coldSessions: getColdSessions(),
      preferences: getPreferences(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whm-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleClearData() {
    await clearAllData();
    setShowClearConfirm(false);
    setCleared(true);
    onDataCleared();
  }

  return (
    <>
      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-surface-light-muted dark:text-on-surface-muted">
          {strings.settings.data}
        </h2>
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-2 text-xs text-on-surface-light-muted dark:text-on-surface-faint">
              {strings.settings.exportDataDescription}
            </p>
            <Button variant="secondary" size="sm" onClick={handleExportData}>
              {strings.settings.exportData}
            </Button>
          </div>
          {cleared ? (
            <p className="text-sm text-success dark:text-success-light">
              {strings.settings.allDataCleared}
            </p>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
            >
              {strings.settings.clearAllData}
            </Button>
          )}
        </div>
      </Card>

      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title={strings.settings.clearConfirm.title}
      >
        <p className="mb-6 text-sm text-on-surface-light-muted dark:text-on-surface-muted">
          {strings.settings.clearConfirm.description}
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => setShowClearConfirm(false)}
          >
            {strings.settings.clearConfirm.cancel}
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            onClick={handleClearData}
          >
            {strings.settings.clearConfirm.confirm}
          </Button>
        </div>
      </Modal>
    </>
  );
}
