import { HTMLAttributes, ReactNode } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium' | 'large';
  children: ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'medium',
  className,
  children,
  ...props
}: BadgeProps) {
  const classNames = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...props}>
      {children}
    </span>
  );
}
