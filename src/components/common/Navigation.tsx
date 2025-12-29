import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import styles from './Navigation.module.css';

export type PageType = 'dashboard' | 'inventory' | 'settings' | 'help';

interface NavigationProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { t } = useTranslation();

  const navItems: { page: PageType; label: string }[] = useMemo(
    () => [
      { page: 'dashboard', label: t('navigation.dashboard') },
      { page: 'inventory', label: t('navigation.inventory') },
      { page: 'settings', label: t('navigation.settings') },
      { page: 'help', label: t('navigation.help') },
    ],
    [t],
  );

  const currentIndex = navItems.findIndex((item) => item.page === currentPage);

  const handleIndexChange = useCallback(
    (index: number) => {
      onNavigate(navItems[index].page);
    },
    [navItems, onNavigate],
  );

  const { containerRef, handleKeyDown, getItemProps } = useKeyboardNavigation({
    itemCount: navItems.length,
    currentIndex,
    onIndexChange: handleIndexChange,
    orientation: 'horizontal',
    loop: true,
  });

  return (
    <nav className={styles.nav} aria-label={t('accessibility.mainNavigation')}>
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={styles.container}
        role="tablist"
        onKeyDown={handleKeyDown}
      >
        {navItems.map((item, index) => (
          <button
            key={item.page}
            role="tab"
            onClick={() => onNavigate(item.page)}
            className={`${styles.navButton} ${
              currentPage === item.page ? styles.active : ''
            }`}
            aria-current={currentPage === item.page ? 'page' : undefined}
            {...getItemProps(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
