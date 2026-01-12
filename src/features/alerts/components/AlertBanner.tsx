import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Alert, AlertType } from '../types';
import styles from './AlertBanner.module.css';

export interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
}

const AlertIcon = ({ type }: { type: AlertType }): ReactNode => {
  switch (type) {
    case 'critical':
      return <span className={styles.icon}>⚠️</span>;
    case 'warning':
      return <span className={styles.icon}>⚡</span>;
    case 'info':
      return <span className={styles.icon}>ℹ️</span>;
  }
};

const getAlertTypeClassName = (type: AlertType): string => {
  const typeClassMap: Record<AlertType, string> = {
    critical: styles.alertCritical,
    warning: styles.alertWarning,
    info: styles.alertInfo,
  };
  return typeClassMap[type];
};

export const AlertBanner = ({ alerts, onDismiss }: AlertBannerProps) => {
  const { t } = useTranslation();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} data-testid="alerts-section">
      <h2 className={styles.title}>{t('dashboard.alerts.title')}</h2>
      <div className={styles.alerts}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`${styles.alert} ${getAlertTypeClassName(alert.type)}`}
          >
            <div className={styles.content}>
              <AlertIcon type={alert.type} />
              <div className={styles.message}>
                {alert.itemName && (
                  <span className={styles.itemName}>{alert.itemName}: </span>
                )}
                {alert.message}
              </div>
            </div>
            {onDismiss && (
              <button
                className={styles.dismissButton}
                onClick={() => onDismiss(alert.id)}
                aria-label={t('actions.dismiss')}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
