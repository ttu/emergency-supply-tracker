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
      if (typeof dialog.showModal === 'function' && !dialog.open) {
        dialog.showModal();
      }
      // Focus after a short delay to ensure dialog is fully rendered
      setTimeout(() => {
        dialog.focus();
      }, 0);
    } else {
      if (typeof dialog.close === 'function' && dialog.open) {
        dialog.close();
      }
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Tab trap for keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const dialog = drawerRef.current;
    if (!dialog) return;

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialog) return;

      const focusableElements = dialog.querySelectorAll<HTMLElement>(
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

    document.addEventListener('keydown', handleTabTrap);

    return () => {
      document.removeEventListener('keydown', handleTabTrap);
    };
  }, [isOpen]);

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

  const contentRef = useRef<HTMLDivElement>(null);

  // Handle backdrop clicks via document listener (avoids SonarCloud warning about non-interactive elements)
  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (e: MouseEvent) => {
      const dialog = drawerRef.current;
      const content = contentRef.current;
      // Close if click is outside the drawer content (on backdrop or dialog element)
      if (
        dialog &&
        content &&
        e.target instanceof Node &&
        !content.contains(e.target) &&
        (e.target === dialog || dialog.contains(e.target))
      ) {
        onClose();
      }
    };

    // Use capture phase to catch clicks before they bubble
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [isOpen, onClose]);

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
      data-testid="sidemenu-drawer"
    >
      <div ref={contentRef} className={styles.drawerInner}>
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
      </div>
    </dialog>
  );

  return createPortal(drawerContent, document.body);
}
