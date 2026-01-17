import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import {
  parseImportJSON,
  mergeImportData,
  getAppData,
  saveAppData,
  createDefaultAppData,
} from '@/shared/utils/storage/localStorage';
import { ImportSelectionModal } from './ImportSelectionModal';
import type {
  ExportSection,
  PartialExportData,
} from '@/shared/types/exportImport';
import { getSectionsWithData } from '@/shared/types/exportImport';
import styles from './ImportButton.module.css';

interface ImportButtonProps {
  onImportSuccess?: () => void;
}

export function ImportButton({ onImportSuccess }: ImportButtonProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importData, setImportData] = useState<PartialExportData | null>(null);

<<<<<<< HEAD
  const validateImportData = (data: PartialExportData): boolean => {
    if (!data || typeof data !== 'object') return false;

    // Must have version and lastModified at minimum
    if (typeof data.version !== 'string') return false;
    if (typeof data.lastModified !== 'string') return false;

    // Must have at least one section with data
    const sectionsWithData = getSectionsWithData(data);
    return sectionsWithData.length > 0;
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onerror = () => {
        console.error('Import error:', reader.error);
        alert(t('settings.import.error'));
      };
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const data = parseImportJSON(json);

          if (!validateImportData(data)) {
            alert(t('settings.import.invalidFormat'));
            return;
          }

          // Store parsed data and open modal for section selection
          setImportData(data);
          setIsModalOpen(true);
        } catch (error) {
          console.error('Import error:', error);
          alert(t('settings.import.error'));
        }
      };

      reader.readAsText(file);

      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [t],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setImportData(null);
  }, []);

  const handleImport = useCallback(
    (sections: ExportSection[]) => {
      if (!importData) return;

      try {
        // Get existing data or create default
        const existing = getAppData() ?? createDefaultAppData();

        // Merge selected sections
        const merged = mergeImportData(existing, importData, sections);

        // Save merged data
        saveAppData(merged);

        alert(t('settings.import.success'));

        if (onImportSuccess) {
          onImportSuccess();
        }

        // Reload to reflect changes
        window.location.reload();
      } catch (error) {
        console.error('Import merge error:', error);
        alert(t('settings.import.error'));
      }

      handleCloseModal();
    },
    [importData, t, onImportSuccess, handleCloseModal],
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
        />
      )}
    </div>
  );
}
