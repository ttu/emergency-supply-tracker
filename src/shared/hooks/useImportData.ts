import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  importFromJSON,
  saveAppData,
} from '@/shared/utils/storage/localStorage';
import { isValidAppData } from '@/shared/utils/validation';
import { useNotification } from './useNotification';

interface UseImportDataOptions {
  onImportSuccess?: () => void;
  skipConfirmation?: boolean;
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
  const { onImportSuccess, skipConfirmation = false } = options;
  const { t } = useTranslation();
  const { showNotification } = useNotification();
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
          showNotification(t('notifications.importError'), 'error');
          return;
        }

        if (
          skipConfirmation ||
          globalThis.confirm(t('settings.import.confirmOverwrite'))
        ) {
          saveAppData(data);
          showNotification(t('notifications.importSuccess'), 'success');
          onImportSuccess?.();
          // Reload to reflect changes
          globalThis.location.reload();
        }
      } catch (error) {
        console.error('Import error:', error);
        showNotification(t('notifications.importError'), 'error');
      }
    },
    [t, onImportSuccess, skipConfirmation, showNotification],
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
