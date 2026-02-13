import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { useNotification } from '@/shared/hooks/useNotification';
import {
  parseMultiInventoryImport,
  importMultiInventory,
  saveRootStorageAfterImport,
  getRootStorageForExport,
  getInventorySetList,
} from '@/shared/utils/storage/localStorage';
import { ImportSelectionModal } from './ImportSelectionModal';
import type {
  MultiInventoryExportData,
  MultiInventoryImportSelection,
} from '@/shared/types/exportImport';
import styles from './ImportButton.module.css';

interface ImportButtonProps {
  onImportSuccess?: () => void;
}

export function ImportButton({ onImportSuccess }: ImportButtonProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importData, setImportData] = useState<MultiInventoryExportData | null>(
    null,
  );
  const [existingNames, setExistingNames] = useState<string[]>([]);

  const validateImportData = (data: MultiInventoryExportData): boolean => {
    if (!data || typeof data !== 'object') return false;

    if (typeof data.version !== 'string') return false;
    if (!Array.isArray(data.inventorySets)) return false;

    // Must have at least one inventory set or settings
    if (data.inventorySets.length === 0 && !data.settings) {
      return false;
    }

    return true;
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onerror = () => {
        console.error('Import error:', reader.error);
        showNotification(t('notifications.importError'), 'error');
      };
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const data = parseMultiInventoryImport(json);

          if (!validateImportData(data)) {
            showNotification(t('notifications.importError'), 'error');
            return;
          }

          // Get existing inventory set names for conflict detection
          const inventorySetList = getInventorySetList();
          setExistingNames(inventorySetList.map((s) => s.name));

          // Store parsed data and open modal for section selection
          setImportData(data);
          setIsModalOpen(true);
        } catch (error) {
          console.error('Import error:', error);
          showNotification(t('notifications.importError'), 'error');
        }
      };

      reader.readAsText(file);

      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [t, showNotification],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setImportData(null);
    setExistingNames([]);
  }, []);

  const handleImport = useCallback(
    (selection: MultiInventoryImportSelection) => {
      if (!importData) return;

      try {
        // Get existing root storage
        const existingRoot = getRootStorageForExport();

        // Import selected inventory sets
        const updatedRoot = importMultiInventory(
          importData,
          selection,
          existingRoot,
        );

        // Save updated root storage
        saveRootStorageAfterImport(updatedRoot);

        showNotification(t('notifications.importSuccess'), 'success');

        if (onImportSuccess) {
          onImportSuccess();
        }

        // Reload to reflect changes
        window.location.reload();
      } catch (error) {
        console.error('Import merge error:', error);
        showNotification(t('notifications.importError'), 'error');
      }

      handleCloseModal();
    },
    [importData, t, onImportSuccess, handleCloseModal, showNotification],
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className={styles.fileInput}
        aria-label={t('settings.import.button')}
        data-testid="import-data-file-input"
      />
      <Button
        variant="secondary"
        onClick={handleClick}
        data-testid="import-data-button"
      >
        {t('settings.import.button')}
      </Button>
      <p className={styles.description}>{t('settings.import.description')}</p>

      {importData && (
        <ImportSelectionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onImport={handleImport}
          importData={importData}
          existingInventorySetNames={existingNames}
        />
      )}
    </div>
  );
}
