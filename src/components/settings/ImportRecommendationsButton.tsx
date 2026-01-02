import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Toast } from '../common/Toast';
import { useRecommendedItems } from '../../hooks/useRecommendedItems';
import { parseRecommendedItemsFile } from '../../utils/validation/recommendedItemsValidation';
import type { RecommendedItemsFile } from '../../types';
import styles from './ImportRecommendationsButton.module.css';

export function ImportRecommendationsButton() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importRecommendedItems } = useRecommendedItems();

  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<RecommendedItemsFile | null>(
    null,
  );
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const reader = new FileReader();

    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      const message =
        reader.error?.message || t('settings.recommendations.import.error');
      setError(message);
    };

    reader.onabort = () => {
      console.warn('FileReader aborted');
      setError(t('settings.recommendations.import.error'));
    };

    reader.onload = (event) => {
      // Don't process if there was an error or abort
      if (reader.error) return;

      try {
        const json = event.target?.result as string;
        const recommendedItemsFile = parseRecommendedItemsFile(json);

        // Store the parsed file and show confirmation dialog
        setPendingFile(recommendedItemsFile);
        setShowConfirm(true);
      } catch (err) {
        console.error('Import recommendations error:', err);
        const message =
          err instanceof Error
            ? err.message
            : t('settings.recommendations.import.error');
        setError(message);
      }
    };

    reader.readAsText(file);

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = useCallback(() => {
    if (!pendingFile) return;

    try {
      const result = importRecommendedItems(pendingFile);
      if (result.valid) {
        setShowSuccessToast(true);
        setError(null);
      } else {
        const errorMessages = result.errors.map((e) => e.message).join('\n');
        setError(errorMessages);
      }
    } catch (err) {
      console.error('Import recommendations error:', err);
      const message =
        err instanceof Error
          ? err.message
          : t('settings.recommendations.import.error');
      setError(message);
    } finally {
      setShowConfirm(false);
      setPendingFile(null);
    }
  }, [pendingFile, importRecommendedItems, t]);

  const handleCancelImport = useCallback(() => {
    setShowConfirm(false);
    setPendingFile(null);
  }, []);

  const handleCloseToast = useCallback(() => {
    setShowSuccessToast(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const confirmMessage = pendingFile
    ? t('settings.recommendations.import.confirmOverwrite', {
        name: pendingFile.meta.name,
        count: pendingFile.items.length,
      })
    : '';

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className={styles.fileInput}
        aria-label={t('settings.recommendations.import.button')}
      />
      <Button variant="secondary" onClick={handleClick}>
        {t('settings.recommendations.import.button')}
      </Button>
      <p className={styles.description}>
        {t('settings.recommendations.import.description')}
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title={t('settings.recommendations.import.button')}
        message={confirmMessage}
        confirmLabel={t('buttons.import')}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelImport}
      />

      <Toast
        isVisible={showSuccessToast}
        message={t('settings.recommendations.import.success')}
        variant="success"
        onClose={handleCloseToast}
      />
    </div>
  );
}
