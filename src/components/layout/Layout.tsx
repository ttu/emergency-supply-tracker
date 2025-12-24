import { ReactNode } from 'react';
import { Header, HeaderProps } from './Header';
import { Footer, FooterProps } from './Footer';
import styles from './Layout.module.css';

export interface LayoutProps {
  children: ReactNode;
  header?: HeaderProps;
  footer?: FooterProps;
  className?: string;
}

export function Layout({ children, header, footer, className }: LayoutProps) {
  const containerClass = [styles.layout, className].filter(Boolean).join(' ');

  return (
    <div className={containerClass}>
      {header && <Header {...header} />}
      <main className={styles.main}>{children}</main>
      {footer && <Footer {...footer} />}
    </div>
  );
}
