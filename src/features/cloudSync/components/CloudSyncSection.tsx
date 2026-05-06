import { useTranslation } from 'react-i18next';
import { CloudSyncStatus } from './CloudSyncStatus';
import { CloudSyncButton } from './CloudSyncButton';
import { ConnectGoogleDrive } from './ConnectGoogleDrive';
import { ConnectOneDrive } from './ConnectOneDrive';
import { useCloudSync } from '../hooks';
import styles from './CloudSyncSection.module.css';

/**
 * Complete cloud sync section for Settings page.
 * Combines status, provider selection, and sync controls.
 *
 * When disconnected, shows all available providers as a chooser.
 * When connected, shows sync controls plus the active provider's
 * disconnect button.
 */
export function CloudSyncSection() {
  const { t } = useTranslation();
  const { state } = useCloudSync();

  const isConnected =
    state.state === 'connected' ||
    state.state === 'syncing' ||
    (state.state === 'error' && state.provider !== null);

  const renderActiveProviderControls = () => {
    if (state.provider === 'onedrive') return <ConnectOneDrive />;
    return <ConnectGoogleDrive />;
  };

  return (
    <div className={styles.container} data-testid="cloud-sync-content">
      <CloudSyncStatus />

      <div className={styles.divider} />

      <div className={styles.actions}>
        <div className={styles.actionGroup}>
          <h3 className={styles.actionTitle}>
            {isConnected
              ? t('cloudSync.section.syncTitle')
              : t('cloudSync.section.connectTitle')}
          </h3>
          {isConnected ? (
            <CloudSyncButton />
          ) : (
            <div
              className={styles.providerChoices}
              data-testid="cloud-sync-provider-choices"
            >
              <ConnectGoogleDrive />
              <ConnectOneDrive />
            </div>
          )}
        </div>

        {isConnected && (
          <div className={styles.actionGroup}>
            <h3 className={styles.actionTitle}>
              {t('cloudSync.section.accountTitle')}
            </h3>
            {renderActiveProviderControls()}
          </div>
        )}
      </div>
    </div>
  );
}
