import { memo, useState, type CSSProperties } from 'react';
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

interface AlertBannerProps {
  onItemSelect: (id: string) => void;
  onCategorySelect: (categoryId: string) => void;
}

const CONTAINER_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const ROW_BASE_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto auto',
  gap: 14,
  alignItems: 'center',
  // Fixed row height so rows with a resolve action line up with those
  // without one.
  minHeight: 44,
  padding: '11px 16px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-panel)',
  border: '1px solid var(--color-rule-soft)',
};

const MESSAGE_BASE_STYLE: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  letterSpacing: 'var(--caps-tracking)',
  background: 'transparent',
  border: 0,
  padding: 0,
  margin: 0,
  textAlign: 'left',
  minWidth: 0,
  width: '100%',
};

const PILL_BUTTON_STYLE: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-text-2)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  padding: '4px 10px',
  cursor: 'pointer',
  borderRadius: 'var(--radius-pill)',
  letterSpacing: '0.08em',
  fontWeight: 700,
  lineHeight: 1,
};

const DISMISS_BUTTON_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 14,
  color: 'var(--color-text-3)',
  cursor: 'pointer',
  lineHeight: 1,
  padding: '0 2px',
  background: 'transparent',
  border: 0,
};

const MESSAGE_BUTTON_STYLE: CSSProperties = {
  ...MESSAGE_BASE_STYLE,
  cursor: 'pointer',
};

/** Severity stripe colour down the leading edge of each row. */
const STRIPE_COLOR: Record<AlertType, string> = {
  critical: 'var(--color-crit)',
  warning: 'var(--color-warn)',
  info: 'var(--color-accent)',
};

/** One row style per severity, so the stripe costs no per-render object. */
const ROW_STYLE: Record<AlertType, CSSProperties> = {
  critical: {
    ...ROW_BASE_STYLE,
    borderLeft: `3px solid ${STRIPE_COLOR.critical}`,
  },
  warning: {
    ...ROW_BASE_STYLE,
    borderLeft: `3px solid ${STRIPE_COLOR.warning}`,
  },
  info: { ...ROW_BASE_STYLE, borderLeft: `3px solid ${STRIPE_COLOR.info}` },
};

const TOGGLE_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  paddingRight: 4,
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
  const { activeAlerts, handleDismissAlert } = useDashboardAlerts();
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
    <div style={CONTAINER_STYLE} data-testid="v2-alert-banner">
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
      {isCollapsible && (
        <div style={TOGGLE_ROW_STYLE}>
          <AccentTextButton
            onClick={() => setExpanded((v) => !v)}
            data-testid="v2-alert-toggle"
          >
            {expanded
              ? t(`v2.alerts.showLess.${themeKey}`)
              : t(`v2.alerts.showMore.${themeKey}`, { count: overflowCount })}
          </AccentTextButton>
        </div>
      )}
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
    <div style={ROW_STYLE[alert.type]} data-testid="v2-alert-row">
      <StatusDot status={ALERT_TYPE_TO_DESIGN_STATUS[alert.type]} size={8} />
      {hasRowAction ? (
        <button
          type="button"
          onClick={handleRowClick}
          data-testid="v2-alert-message"
          style={MESSAGE_BUTTON_STYLE}
        >
          {label}
        </button>
      ) : (
        <span data-testid="v2-alert-message" style={MESSAGE_BASE_STYLE}>
          {label}
        </span>
      )}
      {itemId ? (
        <button
          type="button"
          onClick={() => onSelectItem(itemId)}
          style={PILL_BUTTON_STYLE}
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
        style={DISMISS_BUTTON_STYLE}
      >
        ×
      </button>
    </div>
  );
}

const AlertBannerRow = memo(AlertBannerRowImpl);
