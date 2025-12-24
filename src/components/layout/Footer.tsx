import { ReactNode } from 'react';
import styles from './Footer.module.css';

export interface FooterProps {
  copyright?: ReactNode;
  links?: ReactNode;
}

export function Footer({ copyright, links }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {links && <div className={styles.links}>{links}</div>}
        {copyright && <div className={styles.copyright}>{copyright}</div>}
      </div>
    </footer>
  );
}
