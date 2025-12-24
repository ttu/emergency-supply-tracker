import { ReactNode } from 'react';
import styles from './Header.module.css';

export interface HeaderProps {
  logo?: ReactNode;
  navigation?: ReactNode;
  actions?: ReactNode;
}

export function Header({ logo, navigation, actions }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {logo && <div className={styles.logo}>{logo}</div>}
        {navigation && <nav className={styles.navigation}>{navigation}</nav>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
