import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccentTextButton,
  StatusDot,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDashboardAlerts } from '@/features/dashboard';
import type { Alert, AlertType } from '@/features/alerts';
import type { AlertId } from '@/shared/types';
import { ALERT_TYPE_TO_DESIGN_STATUS } from '@/shared/utils/designStatus';
import styles from './AlertBanner.module.css';

interface AlertBannerProps {
  onItemSelect: (id: string) => void;
  onCategorySelect: (categoryId: string) => void;
}

/** Severity stripe modifier class, one per row style. */
const ROW_STRIPE_CLASS: Record<AlertType, string> = {
  critical: styles.rowCritical,
  warning: styles.rowWarning,
  info: styles.rowInfo,
};

/**
 * How many rows stay visible before the banner collapses. The banner sits
 * directly above the dashboard KPIs, and a stocked household routinely
 * produces a dozen alerts (one per under-stocked category, plus per-item
 * expiry) — rendering them all pushes the actual overview off-screen.
 */
const VISIBLE_ALERT_LIMIT = 3;

/**
 * Dashboard alert banner for the v2 design. Alerts have no page of their own —
 * they surface here, on the overview, mirroring the v1 AlertBanner. Each row
 * carries a severity stripe, a resolve action when the alert points somewhere,
 * and a dismiss control.
 *
 * Alerts arrive already sorted by severity, so the collapsed view always shows
 * the most urgent ones.
 */
export function AlertBanner({
  onItemSelect,
  onCategorySelect,
}: Readonly<AlertBannerProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { activeAlerts, handleDismissAlert, handleDismissAllAlerts } =
    useDashboardAlerts();
  const [expanded, setExpanded] = useState(false);

  if (activeAlerts.length === 0) return null;

  const resolveLabel = t(`v2.voice.resolveAction.${themeKey}`);
  const dismissLabel = t(`v2.alerts.dismiss.${themeKey}`);

  const overflowCount = activeAlerts.length - VISIBLE_ALERT_LIMIT;
  const isCollapsible = overflowCount > 0;
  const visibleAlerts =
    isCollapsible && !expanded
      ? activeAlerts.slice(0, VISIBLE_ALERT_LIMIT)
      : activeAlerts;

  return (
    <div className={styles.container} data-testid="v2-alert-banner">
      {visibleAlerts.map((alert) => (
        <AlertBannerRow
          key={String(alert.id)}
          alert={alert}
          onDismiss={handleDismissAlert}
          onSelectItem={onItemSelect}
          onSelectCategory={onCategorySelect}
          resolveLabel={resolveLabel}
          dismissLabel={dismissLabel}
        />
      ))}
      <div className={styles.toggleRow}>
        {isCollapsible && (
          <AccentTextButton
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            data-testid="v2-alert-toggle"
          >
            {expanded
              ? t(`v2.alerts.showLess.${themeKey}`)
              : t(`v2.alerts.showMore.${themeKey}`, { count: overflowCount })}
          </AccentTextButton>
        )}
        <AccentTextButton
          onClick={handleDismissAllAlerts}
          data-testid="v2-alert-dismiss-all"
        >
          {t(`v2.alerts.dismissAll.${themeKey}`)}
        </AccentTextButton>
      </div>
    </div>
  );
}

interface AlertBannerRowProps {
  alert: Alert;
  onDismiss: (id: AlertId) => void;
  onSelectItem: (id: string) => void;
  onSelectCategory: (categoryId: string) => void;
  resolveLabel: string;
  dismissLabel: string;
}

function AlertBannerRowImpl({
  alert,
  onDismiss,
  onSelectItem,
  onSelectCategory,
  resolveLabel,
  dismissLabel,
}: Readonly<AlertBannerRowProps>) {
  const { categoryId, itemId } = alert;
  const hasRowAction = !!(categoryId || itemId);

  const handleRowClick = () => {
    if (categoryId) onSelectCategory(String(categoryId));
    else if (itemId) onSelectItem(itemId);
  };

  const label = alert.itemName
    ? `${alert.itemName}: ${alert.message}`
    : alert.message;

  return (
    <div
      className={`${styles.row} ${ROW_STRIPE_CLASS[alert.type]}`}
      data-testid="v2-alert-row"
    >
      <StatusDot status={ALERT_TYPE_TO_DESIGN_STATUS[alert.type]} size={8} />
      {hasRowAction ? (
        <button
          type="button"
          onClick={handleRowClick}
          data-testid="v2-alert-message"
          className={`${styles.message} ${styles.messageButton}`}
        >
          {label}
        </button>
      ) : (
        <span data-testid="v2-alert-message" className={styles.message}>
          {label}
        </span>
      )}
      {itemId ? (
        <button
          type="button"
          onClick={() => onSelectItem(itemId)}
          className={styles.pillButton}
        >
          {resolveLabel}
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        aria-label={dismissLabel}
        className={styles.dismissButton}
      >
        ×
      </button>
    </div>
  );
}

const AlertBannerRow = memo(AlertBannerRowImpl);
