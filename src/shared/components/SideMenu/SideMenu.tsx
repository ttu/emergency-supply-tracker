import { useCallback, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useKeyboardNavigation } from '@/shared/hooks/useKeyboardNavigation';
import { SideMenuDrawer } from './SideMenuDrawer';
import styles from './SideMenu.module.css';

export interface SideMenuItem {
  id: string;
  label: string;
  icon?: string;
}

export interface HamburgerButtonProps {
  readonly onClick: () => void;
  readonly isOpen: boolean;
  readonly drawerId: string;
}

export interface SideMenuProps {
  readonly items: readonly SideMenuItem[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly ariaLabel: string;
  readonly showAllOption?: {
    readonly id: string;
    readonly label: string;
    readonly icon?: string;
  };
  /** Render prop for custom hamburger button placement. If provided, the default hamburger is not rendered. */
  readonly renderHamburgerButton?: (
    props: HamburgerButtonProps,
  ) => React.ReactNode;
  /** Container element to render the hamburger button into via portal. */
  readonly hamburgerContainer?: HTMLElement | null;
}

export function SideMenu({
  items,
  selectedId,
  onSelect,
  ariaLabel,
  showAllOption,
  renderHamburgerButton,
  hamburgerContainer,
}: Readonly<SideMenuProps>) {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerId = useId();

  const allItems = useMemo(
    () => (showAllOption ? [showAllOption, ...items] : items),
    [showAllOption, items],
  );
  const currentIndex = allItems.findIndex((item) => item.id === selectedId);

  const handleIndexChange = useCallback(
    (index: number) => {
      const item = allItems[index];
      if (item) {
        onSelect(item.id);
      }
    },
    [allItems, onSelect],
  );

  const { containerRef, handleKeyDown, getItemProps } = useKeyboardNavigation({
    itemCount: allItems.length,
    currentIndex: Math.max(currentIndex, 0),
    onIndexChange: handleIndexChange,
    orientation: 'vertical',
    loop: true,
  });

  const handleItemClick = (id: string) => {
    onSelect(id);
    setIsDrawerOpen(false);
  };

  const menuContent = (
    <nav
      ref={containerRef as React.RefObject<HTMLElement>}
      className={styles.menu}
      role="navigation"
      aria-label={ariaLabel}
    >
      <ul
        className={styles.list}
        role="menu"
        aria-orientation="vertical"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {allItems.map((item, index) => {
          const isActive = item.id === selectedId;
          const itemProps = getItemProps(index);

          return (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className={`${styles.item} ${isActive ? styles.active : ''}`}
                onClick={() => handleItemClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={itemProps.tabIndex}
                data-testid={`sidemenu-item-${item.id}`}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.label}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const hamburgerButton = renderHamburgerButton ? (
    renderHamburgerButton({
      onClick: () => setIsDrawerOpen(true),
      isOpen: isDrawerOpen,
      drawerId,
    })
  ) : (
    <button
      type="button"
      className={styles.hamburger}
      onClick={() => setIsDrawerOpen(true)}
      aria-label={t('navigation.sideMenu.openMenu')}
      aria-expanded={isDrawerOpen}
      aria-controls={drawerId}
      data-testid="sidemenu-hamburger"
    >
      <span className={styles.hamburgerIcon}>
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>
  );

  return (
    <>
      {/* Mobile hamburger button - render in portal if container provided, otherwise inline */}
      {hamburgerContainer
        ? createPortal(hamburgerButton, hamburgerContainer)
        : hamburgerButton}

      {/* Desktop sidebar */}
      <aside className={styles.sidebar} data-testid="sidemenu-sidebar">
        {menuContent}
      </aside>

      {/* Mobile drawer */}
      <SideMenuDrawer
        id={drawerId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        {menuContent}
      </SideMenuDrawer>
    </>
  );
}
