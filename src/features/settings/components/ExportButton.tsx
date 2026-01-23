import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import {
  getAppData,
  exportToJSONSelective,
} from '@/shared/utils/storage/localStorage';
import { downloadFile, generateDateFilename } from '@/shared/utils/download';
import { useBackupTracking } from '@/features/dashboard';
import { ExportSelectionModal } from './ExportSelectionModal';
import type { ExportSection } from '@/shared/types/exportImport';
import type { AppData } from '@/shared/types';
import styles from './ExportButton.module.css';

export function ExportButton() {
  const { t } = useTranslation();
  const { recordBackupDate } = useBackupTracking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appData, setAppData] = useState<AppData | null>(null);

  const handleOpenModal = useCallback(() => {
    const data = getAppData();
    if (!data) {
      alert(t('settings.export.noData'));
      return;
    }
    setAppData(data);
    setIsModalOpen(true);
  }, [t]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setAppData(null);
  }, []);

  const handleExport = useCallback(
    (sections: ExportSection[]) => {
      if (!appData) return;

      const json = exportToJSONSelective(appData, sections);
      const filename = generateDateFilename('emergency-supplies');
      downloadFile(json, filename);

      // Record the backup date
      recordBackupDate();
    },
    [appData, recordBackupDate],
  );

  return (
    <div className={styles.container}>
      <Button
        variant="secondary"
        onClick={handleOpenModal}
        data-testid="export-data-button"
      >
        {t('settings.export.button')}
      </Button>
      <p className={styles.description}>{t('settings.export.description')}</p>

      {appData && (
        <ExportSelectionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onExport={handleExport}
          appData={appData}
        />
      )}
    </div>
  );
}
