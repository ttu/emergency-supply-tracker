import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { useCloudSync } from '../hooks';
import styles from './CloudSyncButton.module.css';

/**
 * Button to trigger manual sync operation.
 * Disabled when disconnected or currently syncing.
 */
export function CloudSyncButton() {
  const { t } = useTranslation();
  const { state, syncNow, clearError } = useCloudSync();
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleSync = async () => {
    setLastResult(null);
    clearError();

    const result = await syncNow();

    if (result.success) {
      switch (result.direction) {
        case 'upload':
          setLastResult(t('cloudSync.result.uploaded'));
          break;
        case 'download':
          // Reload page to reflect downloaded data
          if (result.requiresReload) {
            globalThis.location.reload();
          } else {
            // Only show message if no reload needed
            setLastResult(t('cloudSync.result.downloaded'));
          }
          break;
        case 'none':
          setLastResult(t('cloudSync.result.noChanges'));
          break;
      }
    }
  };

  const isDisabled =
    state.state === 'disconnected' || state.state === 'syncing';
  const isLoading = state.state === 'syncing';

  return (
    <div className={styles.container} data-testid="cloud-sync-button">
      <Button
        variant="primary"
        onClick={handleSync}
        disabled={isDisabled}
        aria-busy={isLoading}
        data-testid="cloud-sync-button-trigger"
      >
        {isLoading ? t('cloudSync.button.syncing') : t('cloudSync.button.sync')}
      </Button>
      {lastResult && (
        <p className={styles.result} data-testid="cloud-sync-result">
          {lastResult}
        </p>
      )}
      <p className={styles.description}>{t('cloudSync.button.description')}</p>
    </div>
  );
}
