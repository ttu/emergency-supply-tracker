import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  importFromJSON,
  saveAppData,
} from '@/shared/utils/storage/localStorage';
import { isValidAppData } from '@/shared/utils/validation';

interface UseImportDataOptions {
  onImportSuccess?: () => void;
}

interface UseImportDataReturn {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
}

/**
 * Hook for handling JSON data import functionality.
 * Provides file input handling, validation, and data persistence.
 *
 * @param options - Optional callbacks for import success
 * @returns File input ref, change handler, and trigger function
 */
export function useImportData(
  options: UseImportDataOptions = {},
): UseImportDataReturn {
  const { onImportSuccess } = options;
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      try {
        const json = await file.text();
        const data = importFromJSON(json);

        if (!isValidAppData(data)) {
          alert(t('settings.import.invalidFormat'));
          return;
        }

        if (globalThis.confirm(t('settings.import.confirmOverwrite'))) {
          saveAppData(data);
          alert(t('settings.import.success'));
          onImportSuccess?.();
          // Reload to reflect changes
          globalThis.location.reload();
        }
      } catch (error) {
        console.error('Import error:', error);
        alert(t('settings.import.error'));
      }
    },
    [t, onImportSuccess],
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    fileInputRef,
    handleFileChange,
    triggerFileInput,
  };
}
