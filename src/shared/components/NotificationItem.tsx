import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './NotificationItem.module.css';

export interface NotificationItemProps {
  readonly message: string;
  readonly variant?: 'success' | 'error' | 'info';
  readonly duration?: number;
  readonly onClose: () => void;
}

/**
 * Notification item component for use in NotificationBar.
 * Similar to Toast but doesn't use portal, allowing proper stacking.
 * Meets WCAG 2.1 AA accessibility requirements.
 */
export function NotificationItem({
  message,
  variant = 'success',
  duration = 3000,
  onClose,
}: Readonly<NotificationItemProps>) {
  const { t } = useTranslation();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, onClose]);

  const getIcon = (): string => {
    if (variant === 'success') return '✓';
    if (variant === 'error') return '✕';
    return 'ℹ';
  };

  const icon = getIcon();

  return (
    <output
      className={`${styles.notification} ${styles[variant]}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.message}>{message}</span>
      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label={t('accessibility.closeModal', 'Close notification')}
      >
        ×
      </button>
    </output>
  );
}
