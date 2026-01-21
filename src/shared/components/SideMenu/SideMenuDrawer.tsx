import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styles from './SideMenu.module.css';

interface SideMenuDrawerProps {
  readonly id?: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

export function SideMenuDrawer({
  id,
  isOpen,
  onClose,
  children,
}: Readonly<SideMenuDrawerProps>) {
  const { t } = useTranslation();
  const drawerRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management and dialog open/close
  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      }
      // Focus after a short delay to ensure dialog is fully rendered
      setTimeout(() => {
        dialog.focus();
      }, 0);
    } else {
      if (typeof dialog.close === 'function') {
        dialog.close();
      }
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Escape key and tab trap
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !drawerRef.current) return;

      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTabTrap);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabTrap);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prevOverflow;
    }

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const drawerContent = (
    <dialog
      ref={drawerRef}
      id={id}
      className={styles.drawer}
      aria-label={t('sideMenu.menuLabel')}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Close dialog when clicking the backdrop (the dialog element itself)
        if (e.target === drawerRef.current) {
          onClose();
        }
      }}
      data-testid="sidemenu-drawer"
    >
      <div className={styles.drawerHeader}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t('sideMenu.closeMenu')}
          data-testid="sidemenu-close"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div className={styles.drawerContent}>{children}</div>
    </dialog>
  );

  return createPortal(drawerContent, document.body);
}
