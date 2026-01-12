import { useTranslation } from 'react-i18next';
import { useCloudSync } from '../hooks';
import styles from './CloudSyncStatus.module.css';

/**
 * Displays the current cloud sync status.
 * Shows connection state, last sync time, and any errors.
 */
export function CloudSyncStatus() {
  const { t, i18n } = useTranslation();
  const { state } = useCloudSync();

  const getStatusText = () => {
    switch (state.state) {
      case 'disconnected':
        return t('cloudSync.status.disconnected');
      case 'connected':
        return t('cloudSync.status.connected');
      case 'syncing':
        return t('cloudSync.status.syncing');
      case 'error':
        return t('cloudSync.status.error');
      default:
        return t('cloudSync.status.disconnected');
    }
  };

  const getStatusClass = () => {
    switch (state.state) {
      case 'disconnected':
        return styles.disconnected;
      case 'connected':
        return styles.connected;
      case 'syncing':
        return styles.syncing;
      case 'error':
        return styles.error;
      default:
        return styles.disconnected;
    }
  };

  const formatLastSync = () => {
    if (!state.lastSyncTimestamp) {
      return t('cloudSync.status.neverSynced');
    }

    const date = new Date(state.lastSyncTimestamp);
    return t('cloudSync.status.lastSync', {
      date: date.toLocaleDateString(i18n.language),
      time: date.toLocaleTimeString(i18n.language),
    });
  };

  return (
    <div className={styles.container} data-testid="cloud-sync-status">
      <div className={styles.statusRow}>
        <span
          className={`${styles.indicator} ${getStatusClass()}`}
          data-testid="cloud-sync-status-indicator"
        />
        <span
          className={styles.statusText}
          data-testid="cloud-sync-status-text"
        >
          {getStatusText()}
        </span>
        {state.provider && (
          <span className={styles.provider} data-testid="cloud-sync-provider">
            ({t(`cloudSync.providers.${state.provider}`)})
          </span>
        )}
      </div>
      {state.state !== 'disconnected' && (
        <p className={styles.lastSync} data-testid="cloud-sync-last-sync">
          {formatLastSync()}
        </p>
      )}
      {state.error && (
        <p className={styles.errorMessage} data-testid="cloud-sync-error">
          {state.error}
        </p>
      )}
    </div>
  );
}
