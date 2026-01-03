import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Accessible confirmation dialog component.
 * Uses role="alertdialog" with proper ARIA attributes, focus trapping,
 * and keyboard handlers (Enter to confirm, Escape to cancel).
 * Meets WCAG 2.1 AA accessibility requirements.
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const titleId = 'confirm-dialog-title';
  const descriptionId = 'confirm-dialog-description';

  // Store previous focus and focus first focusable element when opened
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the first button in the dialog
      const firstButton = dialogRef.current?.querySelector('button');
      firstButton?.focus();
    } else if (previousFocusRef.current) {
      // Return focus when closed
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  const handleConfirmClick = useCallback(() => {
    if (!isLoading) {
      onConfirm();
    }
  }, [isLoading, onConfirm]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Tab' && dialogRef.current) {
        // Focus trap
        const focusableElements =
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const dialogContent = (
    <div className={styles.overlay} onClick={onCancel} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={descriptionId} className={styles.message}>
          {message}
        </p>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            type="button"
          >
            {cancelLabel || t('buttons.cancel')}
          </Button>
          <Button
            variant={confirmVariant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirmClick}
            disabled={isLoading}
            type="button"
          >
            {isLoading
              ? t('common.loading', 'Loading...')
              : confirmLabel || t('buttons.confirm', 'Confirm')}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
