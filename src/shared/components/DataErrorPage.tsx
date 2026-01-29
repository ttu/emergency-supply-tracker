import { useTranslation } from 'react-i18next';
import {
  STORAGE_KEY,
  clearAppData,
  getLastDataValidationResult,
  clearDataValidationResult,
} from '@/shared/utils/storage/localStorage';
import { clearErrorLogs } from '@/shared/utils/errorLogger/storage';
import { clearAnalyticsData } from '@/shared/utils/analytics/storage';
import { downloadFile, generateDateFilename } from '@/shared/utils/download';
import type { DataValidationResult } from '@/shared/utils/validation/appDataValidation';
import styles from './ErrorBoundary.module.css';

/** Basename for exported file when data failed validation (user-visible filename). */
const EXPORT_BASENAME_CORRUPTED = 'emergency-supplies-corrupted';
/** Basename for exported raw JSON when parse fails (user-visible filename). */
const EXPORT_BASENAME_RAW = 'emergency-supplies-raw';

interface DataErrorPageProps {
  readonly onRetry?: () => void;
  /** Override for validation result (used in Storybook) */
  readonly validationResultOverride?: DataValidationResult | null;
}

/**
 * Page displayed when stored data fails validation.
 * Allows users to download their data before clearing, or to clear and start fresh.
 */
export function DataErrorPage({
  onRetry,
  validationResultOverride,
}: DataErrorPageProps) {
  const { t } = useTranslation();
  // Use override if provided (for Storybook), otherwise get from localStorage
  const validationResult =
    validationResultOverride === undefined
      ? getLastDataValidationResult()
      : validationResultOverride;

  const handleReload = (): void => {
    globalThis.location.reload();
  };

  const handleDownloadData = (): void => {
    // Get raw data from localStorage to allow downloading even if it fails validation
    const rawJson = localStorage.getItem(STORAGE_KEY);
    if (!rawJson) {
      globalThis.alert(t('settings.export.noData'));
      return;
    }

    // Add error info to the export so user knows why it failed
    const exportReason = t('dataError.page.exportReason');
    try {
      const rawData = JSON.parse(rawJson);
      const exportData = {
        ...rawData,
        _exportInfo: {
          exportedAt: new Date().toISOString(),
          validationErrors: validationResult?.errors ?? [],
          reason: exportReason,
        },
      };
      const json = JSON.stringify(exportData, null, 2);
      const filename = generateDateFilename(EXPORT_BASENAME_CORRUPTED);
      downloadFile(json, filename);
    } catch {
      // If parsing fails, export the raw JSON as-is
      const filename = generateDateFilename(EXPORT_BASENAME_RAW);
      downloadFile(rawJson, filename);
    }
  };

  const handleDeleteData = (): void => {
    if (globalThis.confirm(t('errorBoundary.dataManagement.confirmDelete'))) {
      if (
        globalThis.confirm(t('errorBoundary.dataManagement.confirmDeleteAgain'))
      ) {
        clearAppData();
        clearErrorLogs();
        clearAnalyticsData();
        clearDataValidationResult();
        globalThis.alert(t('errorBoundary.dataManagement.deleteSuccess'));
        if (onRetry) {
          onRetry();
        } else {
          globalThis.location.reload();
        }
      }
    }
  };

  // Format errors for display (translate message when it is an i18n key)
  const errorSummary = validationResult?.errors.length
    ? validationResult.errors
        .map((err) => {
          const opts = err.interpolation
            ? { ...err.interpolation, defaultValue: err.message }
            : { defaultValue: err.message };
          return `${err.field}: ${t(err.message, opts)}`;
        })
        .join('\n')
    : t('dataError.page.unknownError');

  return (
    <div className={styles.container} role="alert">
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">
          ⚠️
        </div>
        <h1 className={styles.title}>{t('dataError.page.title')}</h1>
        <p className={styles.message}>{t('dataError.page.message')}</p>
        <details className={styles.details}>
          <summary className={styles.summary}>
            {t('dataError.page.details')}
          </summary>
          <pre className={styles.errorText}>{errorSummary}</pre>
        </details>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleReload}
          >
            {t('errorBoundary.reload')}
          </button>
        </div>

        <div className={styles.dataManagement}>
          <h2 className={styles.dataManagementTitle}>
            {t('errorBoundary.dataManagement.title')}
          </h2>
          <p className={styles.dataManagementDescription}>
            {t('dataError.page.dataManagementDescription')}
          </p>
          <div className={styles.dataManagementActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleDownloadData}
              data-testid="data-error-download-button"
            >
              {t('errorBoundary.dataManagement.downloadData')}
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleDeleteData}
              data-testid="data-error-delete-button"
            >
              {t('errorBoundary.dataManagement.deleteData')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
