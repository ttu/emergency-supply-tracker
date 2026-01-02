import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

export interface ToastProps {
  isVisible: boolean;
  message: string;
  variant?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

/**
 * Accessible toast notification component.
 * Uses role="status" with aria-live="polite" for screen reader announcements.
 * Auto-dismisses after the specified duration.
 * Meets WCAG 2.1 AA accessibility requirements.
 */
export function Toast({
  isVisible,
  message,
  variant = 'success',
  duration = 3000,
  onClose,
}: ToastProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isVisible && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icon = variant === 'success' ? '✓' : variant === 'error' ? '✕' : 'ℹ';

  const toastContent = (
    <div
      className={`${styles.toast} ${styles[variant]}`}
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
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );

  return createPortal(toastContent, document.body);
}
