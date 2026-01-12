import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import {
  importFromJSON,
  saveAppData,
} from '@/shared/utils/storage/localStorage';
import type { AppData } from '@/shared/types';
import styles from './ImportButton.module.css';

interface ImportButtonProps {
  onImportSuccess?: () => void;
}

export function ImportButton({ onImportSuccess }: ImportButtonProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAppData = (data: unknown): data is AppData => {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;

    return (
      typeof d.version === 'string' &&
      typeof d.household === 'object' &&
      typeof d.settings === 'object' &&
      Array.isArray(d.items) &&
      typeof d.lastModified === 'string'
      // categories is optional - will be populated from STANDARD_CATEGORIES if missing
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = importFromJSON(json);

        if (!validateAppData(data)) {
          alert(t('settings.import.invalidFormat'));
          return;
        }

        if (window.confirm(t('settings.import.confirmOverwrite'))) {
          saveAppData(data);
          alert(t('settings.import.success'));
          if (onImportSuccess) {
            onImportSuccess();
          }
          // Reload to reflect changes
          window.location.reload();
        }
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
  };

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
    </div>
  );
}
