import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { useCloudSync } from '../hooks';
import styles from './ConnectOneDrive.module.css';

/**
 * Component to connect/disconnect from Microsoft OneDrive.
 * Mirrors ConnectGoogleDrive — shows connect button when disconnected,
 * disconnect option when connected.
 */
export function ConnectOneDrive() {
  const { t } = useTranslation();
  const { state, connect, disconnect } = useCloudSync();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isConnected =
    state.provider === 'onedrive' &&
    (state.state === 'connected' ||
      state.state === 'syncing' ||
      state.state === 'error');

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect('onedrive');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = globalThis.confirm(t('cloudSync.disconnect.confirm'));
    if (!confirmed) return;

    setIsDisconnecting(true);
    try {
      await disconnect();
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isConnected) {
    return (
      <div className={styles.container} data-testid="connect-onedrive">
        <div className={styles.connectedInfo}>
          <span className={styles.providerIcon}>
            <OneDriveIcon />
          </span>
          <span className={styles.connectedText}>
            {t('cloudSync.onedrive.connected')}
          </span>
        </div>
        <Button
          variant="secondary"
          onClick={handleDisconnect}
          disabled={isDisconnecting || state.state === 'syncing'}
          data-testid="cloud-sync-disconnect-button"
        >
          {isDisconnecting
            ? t('cloudSync.disconnect.disconnecting')
            : t('cloudSync.disconnect.button')}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="connect-onedrive">
      <Button
        variant="secondary"
        onClick={handleConnect}
        disabled={isConnecting}
        className={styles.oneDriveButton}
        data-testid="cloud-sync-connect-onedrive-button"
      >
        <OneDriveIcon />
        <span>
          {isConnecting
            ? t('cloudSync.onedrive.connecting')
            : t('cloudSync.onedrive.connect')}
        </span>
      </Button>
      <p className={styles.description}>
        {t('cloudSync.onedrive.description')}
      </p>
    </div>
  );
}

/**
 * OneDrive icon SVG (Microsoft cloud emblem in OneDrive blue).
 */
function OneDriveIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14.5 8.5C13.7 6.5 11.7 5 9.5 5C6.7 5 4.4 7.1 4.1 9.8C2.3 10.2 1 11.7 1 13.5C1 15.4 2.6 17 4.5 17H17.5C19.4 17 21 15.4 21 13.5C21 11.9 19.9 10.6 18.4 10.2C18.5 9.8 18.5 9.4 18.5 9C18.5 6.5 16.5 4.5 14 4.5C13.4 4.5 12.9 4.6 12.4 4.8"
        fill="#0078D4"
      />
      <path
        d="M5 13L8 11L11 12.5L14 10L19 13L17.5 17H4.5L5 13Z"
        fill="#28A8EA"
      />
    </svg>
  );
}
