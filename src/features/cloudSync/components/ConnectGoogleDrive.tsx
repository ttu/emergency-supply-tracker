import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { useCloudSync } from '../hooks';
import styles from './ConnectGoogleDrive.module.css';

/**
 * Component to connect/disconnect from Google Drive.
 * Shows Google sign-in button when disconnected,
 * disconnect option when connected.
 */
export function ConnectGoogleDrive() {
  const { t } = useTranslation();
  const { state, connect, disconnect } = useCloudSync();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isConnected =
    state.provider === 'google-drive' &&
    (state.state === 'connected' ||
      state.state === 'syncing' ||
      state.state === 'error');

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect('google-drive');
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
      <div className={styles.container} data-testid="connect-google-drive">
        <div className={styles.connectedInfo}>
          <span className={styles.providerIcon}>
            <GoogleDriveIcon />
          </span>
          <span className={styles.connectedText}>
            {t('cloudSync.google.connected')}
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
    <div className={styles.container} data-testid="connect-google-drive">
      <Button
        variant="secondary"
        onClick={handleConnect}
        disabled={isConnecting}
        className={styles.googleButton}
        data-testid="cloud-sync-connect-button"
      >
        <GoogleDriveIcon />
        <span>
          {isConnecting
            ? t('cloudSync.google.connecting')
            : t('cloudSync.google.connect')}
        </span>
      </Button>
      <p className={styles.description}>{t('cloudSync.google.description')}</p>
    </div>
  );
}

/**
 * Google Drive icon SVG component.
 */
function GoogleDriveIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M7.71 3.5L1.15 15L4.58 21L11.13 9.5L7.71 3.5Z" fill="#0066DA" />
      <path d="M16.29 3.5H7.71L14.27 15H22.85L16.29 3.5Z" fill="#00AC47" />
      <path d="M1.15 15L4.58 21H19.42L22.85 15H1.15Z" fill="#FFBA00" />
    </svg>
  );
}
