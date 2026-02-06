import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import {
  getRootStorageForExport,
  getInventorySetsForExport,
  exportMultiInventory,
  hasSettingsData,
} from '@/shared/utils/storage/localStorage';
import { downloadFile, generateDateFilename } from '@/shared/utils/download';
import { useBackupTracking } from '@/features/dashboard';
import { useNotification } from '@/shared/hooks/useNotification';
import { ExportSelectionModal } from './ExportSelectionModal';
import type { MultiInventoryExportSelection } from '@/shared/types/exportImport';
import type { RootStorage } from '@/shared/types';
import type { InventorySetExportInfo } from '@/shared/utils/storage/localStorage';
import styles from './ExportButton.module.css';

export function ExportButton() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { recordBackupDate } = useBackupTracking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rootStorage, setRootStorage] = useState<RootStorage | null>(null);
  const [inventorySets, setInventorySets] = useState<InventorySetExportInfo[]>(
    [],
  );
  const [hasSettings, setHasSettings] = useState(false);

  const handleOpenModal = useCallback(() => {
    const root = getRootStorageForExport();
    if (!root) {
      alert(t('settings.export.noData'));
      return;
    }
    setRootStorage(root);
    setInventorySets(getInventorySetsForExport());
    setHasSettings(hasSettingsData());
    setIsModalOpen(true);
  }, [t]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setRootStorage(null);
    setInventorySets([]);
  }, []);

  const handleExport = useCallback(
    (selection: MultiInventoryExportSelection) => {
      if (!rootStorage) return;

      try {
        const json = exportMultiInventory(rootStorage, selection);
        const filename = generateDateFilename('emergency-supplies');
        downloadFile(json, filename);

        // Record the backup date
        recordBackupDate();
        showNotification(t('notifications.backupSuccess'), 'success');
      } catch (error) {
        console.error('Export error:', error);
        showNotification(t('notifications.exportError'), 'error');
      }
    },
    [rootStorage, recordBackupDate, showNotification, t],
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

      {rootStorage && (
        <ExportSelectionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onExport={handleExport}
          inventorySets={inventorySets}
          hasSettings={hasSettings}
        />
      )}
    </div>
  );
}
