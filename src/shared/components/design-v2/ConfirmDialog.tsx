import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { Button, CAPS_STYLE, Panel } from './primitives';

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
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      dialogRef.current?.querySelector('button')?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
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
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: 16,
      }}
    >
      {/* Click-outside-to-cancel as a real button rather than a click handler
          on the scrim div: a non-interactive element with a mouse listener is
          unreachable by keyboard. Labelled "dismiss" rather than "cancel" so
          it does not present as a second control with the same name as the
          dialog's own Cancel button. */}
      <button
        type="button"
        onClick={onCancel}
        aria-label={t('actions.dismiss')}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          border: 0,
          padding: 0,
          cursor: 'default',
        }}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        style={{ position: 'relative', maxWidth: 460, width: '100%' }}
      >
        <Panel padding={24}>
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: themeKey === 'pantry' ? 20 : 16,
              fontWeight: 600,
              letterSpacing: themeKey === 'pantry' ? '-0.01em' : '0.04em',
              color: 'var(--color-text)',
              ...(themeKey === 'pantry' ? {} : CAPS_STYLE),
            }}
          >
            {title}
          </h2>
          <p
            id={messageId}
            style={{
              marginTop: 12,
              marginBottom: 0,
              fontSize: 14,
              color: 'var(--color-text-2)',
              lineHeight: 1.55,
            }}
          >
            {message}
          </p>
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
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
