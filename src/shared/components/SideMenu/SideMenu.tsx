import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKeyboardNavigation } from '@/shared/hooks/useKeyboardNavigation';
import { SideMenuDrawer } from './SideMenuDrawer';
import styles from './SideMenu.module.css';

export interface SideMenuItem {
  id: string;
  label: string;
  icon?: string;
}

export interface SideMenuProps {
  items: SideMenuItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
  showAllOption?: {
    id: string;
    label: string;
    icon?: string;
  };
}

export function SideMenu({
  items,
  selectedId,
  onSelect,
  ariaLabel,
  showAllOption,
}: SideMenuProps) {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    currentIndex: currentIndex >= 0 ? currentIndex : 0,
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
      onKeyDown={handleKeyDown}
    >
      <ul className={styles.list} role="menubar" aria-orientation="vertical">
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

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        className={styles.hamburger}
        onClick={() => setIsDrawerOpen(true)}
        aria-label={t('sideMenu.openMenu')}
        aria-expanded={isDrawerOpen}
        aria-controls="sidemenu-drawer"
        data-testid="sidemenu-hamburger"
      >
        <span className={styles.hamburgerIcon}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Desktop sidebar */}
      <aside className={styles.sidebar} data-testid="sidemenu-sidebar">
        {menuContent}
      </aside>

      {/* Mobile drawer */}
      <SideMenuDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        {menuContent}
      </SideMenuDrawer>
    </>
  );
}
