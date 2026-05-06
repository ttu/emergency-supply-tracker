import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { useCloudSync } from '../hooks';
import styles from './ConnectICloud.module.css';

/**
 * Component to connect/disconnect from Apple iCloud.
 * Mirrors ConnectGoogleDrive / ConnectOneDrive — shows the connect button
 * when disconnected, the disconnect option when connected.
 */
export function ConnectICloud() {
  const { t } = useTranslation();
  const { state, connect, disconnect } = useCloudSync();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isConnected =
    state.provider === 'icloud' &&
    (state.state === 'connected' ||
      state.state === 'syncing' ||
      state.state === 'error');

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect('icloud');
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
      <div className={styles.container} data-testid="connect-icloud">
        <div className={styles.connectedInfo}>
          <span className={styles.providerIcon}>
            <ICloudIcon />
          </span>
          <span className={styles.connectedText}>
            {t('cloudSync.icloud.connected')}
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
    <div className={styles.container} data-testid="connect-icloud">
      <Button
        variant="secondary"
        onClick={handleConnect}
        disabled={isConnecting}
        className={styles.iCloudButton}
        data-testid="cloud-sync-connect-icloud-button"
      >
        <ICloudIcon />
        <span>
          {isConnecting
            ? t('cloudSync.icloud.connecting')
            : t('cloudSync.icloud.connect')}
        </span>
      </Button>
      <p className={styles.description}>{t('cloudSync.icloud.description')}</p>
    </div>
  );
}

/**
 * iCloud icon SVG (cloud emblem in iCloud blue).
 */
function ICloudIcon() {
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
        d="M17.5 18H6.5C4 18 2 16 2 13.5C2 11.2 3.7 9.3 6 9C6.5 6.2 9 4 12 4C14.7 4 17 5.8 17.7 8.3C20 8.6 22 10.6 22 13C22 15.8 19.8 18 17.5 18Z"
        fill="#3693F3"
      />
    </svg>
  );
}
