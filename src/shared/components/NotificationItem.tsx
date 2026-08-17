import { useTranslation } from 'react-i18next';
import styles from './NotificationItem.module.css';

export interface NotificationItemProps {
  readonly message: string;
  readonly variant?: 'success' | 'error' | 'info';
  readonly onClose: () => void;
}

const VARIANT_ICONS: Record<
  NonNullable<NotificationItemProps['variant']>,
  string
> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

/**
 * Notification item component for use in NotificationBar.
 * Similar to Toast but doesn't use portal, allowing proper stacking.
 * Meets WCAG 2.1 AA accessibility requirements.
 *
 * Auto-dismiss timing is owned by NotificationProvider, not this component -
 * that's what lets repeated updates to the same item extend the timer
 * instead of racing an independent per-item clock.
 */
export function NotificationItem({
  message,
  variant = 'success',
  onClose,
}: Readonly<NotificationItemProps>) {
  const { t } = useTranslation();

  const icon = VARIANT_ICONS[variant];

  return (
    <output
      className={`${styles.notification} ${styles[variant]}`}
      aria-live="polite"
      aria-atomic="true"
      data-testid={`notification-item-${variant}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.message} data-testid="notification-message">
        {message}
      </span>
      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label={t('accessibility.closeModal', 'Close notification')}
        data-testid="notification-close-button"
      >
        ×
      </button>
    </output>
  );
}
