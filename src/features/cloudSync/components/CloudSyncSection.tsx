import { useTranslation } from 'react-i18next';
import { CloudSyncStatus } from './CloudSyncStatus';
import { CloudSyncButton } from './CloudSyncButton';
import { ConnectGoogleDrive } from './ConnectGoogleDrive';
import { useCloudSync } from '../hooks';
import styles from './CloudSyncSection.module.css';

/**
 * Complete cloud sync section for Settings page.
 * Combines status, connection, and sync controls.
 */
export function CloudSyncSection() {
  const { t } = useTranslation();
  const { state } = useCloudSync();

  const isConnected =
    state.state === 'connected' ||
    state.state === 'syncing' ||
    (state.state === 'error' && state.provider !== null);

  return (
    <div className={styles.container}>
      <CloudSyncStatus />

      <div className={styles.divider} />

      <div className={styles.actions}>
        <div className={styles.actionGroup}>
          <h3 className={styles.actionTitle}>
            {isConnected
              ? t('cloudSync.section.syncTitle')
              : t('cloudSync.section.connectTitle')}
          </h3>
          {isConnected ? <CloudSyncButton /> : <ConnectGoogleDrive />}
        </div>

        {isConnected && (
          <div className={styles.actionGroup}>
            <h3 className={styles.actionTitle}>
              {t('cloudSync.section.accountTitle')}
            </h3>
            <ConnectGoogleDrive />
          </div>
        )}
      </div>
    </div>
  );
}
