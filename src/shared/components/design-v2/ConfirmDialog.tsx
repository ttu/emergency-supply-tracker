import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { Button, CAPS_STYLE, Panel } from './primitives';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  /** Controlled-open. Render the component conditionally — when `open` is
   *  false the dialog returns null and skips the portal entirely. */
  open: boolean;
  /** Short header text. */
  title: string;
  /** Body explaining what's about to happen. */
  message: ReactNode;
  /** Optional override for the confirm button label. */
  confirmLabel?: string;
  /** Optional override for the cancel button label. */
  cancelLabel?: string;
  /** Confirm button style. `'danger'` paints it red, `'primary'` accent. */
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * v2 confirmation dialog. Same a11y shape as the v1 ConfirmDialog
 * (`role="alertdialog"`, focus trap, ESC to cancel, focus restore on close)
 * but rendered with v2 primitives (`Panel`, v2 `Button`) so it picks up the
 * active cockpit/civil/pantry theme tokens automatically.
 *
 * Use when a destructive action needs explicit confirmation and the host
 * surface is part of the design-v2 shell. For v1 surfaces, prefer
 * `@/shared/components/ConfirmDialog`.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  onConfirm,
  onCancel,
}: Readonly<ConfirmDialogProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const titleId = 'v2-confirm-dialog-title';
  const messageId = 'v2-confirm-dialog-message';

  // Focus management — store the previously-focused element on open and
  // restore it on close.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    previousFocusRef.current = previouslyFocused;
    dialogRef.current?.querySelector('button')?.focus();
    // Restoring from cleanup covers unmounting as well as closing; the
    // previous version only restored when the component stayed mounted and
    // `open` flipped to false.
    return () => previouslyFocused?.focus();
  }, [open]);

  // ESC to cancel + focus trap inside the dialog.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      // `message` is a ReactNode, so the dialog can hold links and form
      // controls as well as its own two buttons. Trapping on buttons alone let
      // Tab walk out of the dialog and behind the scrim.
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        [
          'button:not([disabled])',
          'a[href]',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(', '),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  // Prevent body scroll while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const dialogContent = (
    <div className={styles.overlay}>
      {/* Click-outside-to-cancel as a real button rather than a click handler
          on the scrim div: a non-interactive element with a mouse listener is
          unreachable by keyboard. Labelled "dismiss" rather than "cancel" so
          it does not present as a second control with the same name as the
          dialog's own Cancel button. */}
      <button
        type="button"
        onClick={onCancel}
        aria-label={t('actions.dismiss')}
        className={styles.scrim}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className={styles.dialog}
      >
        <Panel padding={24}>
          <h2
            id={titleId}
            className={styles.title}
            style={{
              fontSize: themeKey === 'pantry' ? 20 : 16,
              letterSpacing: themeKey === 'pantry' ? '-0.01em' : '0.04em',
              ...(themeKey === 'pantry' ? {} : CAPS_STYLE),
            }}
          >
            {title}
          </h2>
          {/* A div, not a p: `message` is a ReactNode and callers pass lists
              and paragraphs, which cannot legally nest inside one. */}
          <div id={messageId} className={styles.message}>
            {message}
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onCancel}>
              {cancelLabel ?? t(`v2.voice.cancel.${themeKey}`)}
            </Button>
            <Button
              variant={tone === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
            >
              {confirmLabel ?? t(`v2.voice.continueAction.${themeKey}`)}
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
