import { useTranslation } from 'react-i18next';
import styles from './Navigation.module.css';

export type PageType = 'dashboard' | 'inventory' | 'settings';

interface NavigationProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { t } = useTranslation();

  const navItems: { page: PageType; label: string }[] = [
    { page: 'dashboard', label: t('navigation.dashboard') },
    { page: 'inventory', label: t('navigation.inventory') },
    { page: 'settings', label: t('navigation.settings') },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`${styles.navButton} ${
              currentPage === item.page ? styles.active : ''
            }`}
            aria-current={currentPage === item.page ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
