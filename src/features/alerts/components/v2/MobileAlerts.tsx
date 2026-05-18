import { memo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Caption,
  NumberDisplay,
  Panel,
  StatusDot,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDashboardAlerts } from '@/features/dashboard';
import type { Alert, AlertType } from '@/features/alerts';
import type { AlertId } from '@/shared/types';
import type { DesignStatus } from '@/shared/utils/designStatus';

interface MobileAlertsProps {
  onItemSelect: (id: string) => void;
  onCategorySelect: (id: string) => void;
}

const ALERT_TYPE_TO_DOT: Record<AlertType, DesignStatus> = {
  critical: 'crit',
  warning: 'warn',
  info: 'ok',
};

const CONTAINER_STYLE: CSSProperties = {
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const COUNTS_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
};

const COUNT_TILE_VALUE_STYLE: CSSProperties = { marginTop: 4 };

const EMPTY_STATE_STYLE: CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: 'var(--color-text-2)',
};

const ROW_BASE_STYLE: CSSProperties = {
  padding: '12px 14px',
  display: 'grid',
  gridTemplateColumns: '12px 1fr auto',
  gap: 10,
  alignItems: 'center',
};

const STATUS_DOT_WRAP_STYLE: CSSProperties = { marginTop: 5 };

const ROW_BUTTON_BASE_STYLE: CSSProperties = {
  background: 'transparent',
  border: 0,
  textAlign: 'left',
  fontFamily: 'inherit',
  color: 'inherit',
  padding: 0,
  minWidth: 0,
};

const ROW_TITLE_STYLE: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
};
const ROW_MESSAGE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-2)',
  marginTop: 3,
};

const DISMISS_BUTTON_STYLE: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-text-3)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  padding: '3px 8px',
  cursor: 'pointer',
  borderRadius: 'var(--radius-pill)',
  fontWeight: 700,
};

export function MobileAlerts({
  onItemSelect,
  onCategorySelect,
}: Readonly<MobileAlertsProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { activeAlerts, handleDismissAlert } = useDashboardAlerts();
  const counts = {
    crit: activeAlerts.filter((a) => a.type === 'critical').length,
    warn: activeAlerts.filter((a) => a.type === 'warning').length,
    info: activeAlerts.filter((a) => a.type === 'info').length,
  };
  const dismissAria = t('v2.alerts.dismissAria');

  return (
    <div style={CONTAINER_STYLE}>
      <div style={COUNTS_GRID_STYLE}>
        <Panel padding={12}>
          <Caption>{t(`v2.voice.critical.${themeKey}`)}</Caption>
          <div style={COUNT_TILE_VALUE_STYLE}>
            <NumberDisplay
              value={counts.crit}
              size={24}
              tone={counts.crit > 0 ? 'crit' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={12}>
          <Caption>{t(`v2.voice.warning.${themeKey}`)}</Caption>
          <div style={COUNT_TILE_VALUE_STYLE}>
            <NumberDisplay
              value={counts.warn}
              size={24}
              tone={counts.warn > 0 ? 'warn' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={12}>
          <Caption>{t(`v2.alerts.info.${themeKey}`)}</Caption>
          <div style={COUNT_TILE_VALUE_STYLE}>
            <NumberDisplay value={counts.info} size={24} />
          </div>
        </Panel>
      </div>
      <Panel padding={0}>
        {activeAlerts.length === 0 && (
          <div style={EMPTY_STATE_STYLE}>
            {t(`v2.alerts.emptyShort.${themeKey}`)}
          </div>
        )}
        {activeAlerts.map((a, i) => (
          <MobileAlertRow
            key={String(a.id)}
            alert={a}
            isLast={i === activeAlerts.length - 1}
            onDismiss={handleDismissAlert}
            onSelectItem={onItemSelect}
            onSelectCategory={onCategorySelect}
            dismissAria={dismissAria}
          />
        ))}
      </Panel>
    </div>
  );
}

interface MobileAlertRowProps {
  alert: Alert;
  isLast: boolean;
  onDismiss: (id: AlertId) => void;
  onSelectItem: (id: string) => void;
  onSelectCategory: (id: string) => void;
  dismissAria: string;
}

function MobileAlertRowImpl({
  alert,
  isLast,
  onDismiss,
  onSelectItem,
  onSelectCategory,
  dismissAria,
}: Readonly<MobileAlertRowProps>) {
  const hasAction = !!(alert.categoryId || alert.itemId);
  const handleClick = () => {
    if (alert.categoryId) onSelectCategory(String(alert.categoryId));
    else if (alert.itemId) onSelectItem(alert.itemId);
  };
  const handleDismiss = () => onDismiss(alert.id);

  const rowStyle: CSSProperties = {
    ...ROW_BASE_STYLE,
    borderBottom: isLast ? 'none' : '1px solid var(--color-rule-soft)',
  };
  const rowButtonStyle: CSSProperties = {
    ...ROW_BUTTON_BASE_STYLE,
    cursor: hasAction ? 'pointer' : 'default',
  };

  return (
    <div style={rowStyle}>
      <div style={STATUS_DOT_WRAP_STYLE}>
        <StatusDot status={ALERT_TYPE_TO_DOT[alert.type]} size={7} />
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={!hasAction}
        style={rowButtonStyle}
      >
        <div style={ROW_TITLE_STYLE}>{alert.itemName ?? alert.message}</div>
        {alert.itemName && <div style={ROW_MESSAGE_STYLE}>{alert.message}</div>}
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={dismissAria}
        style={DISMISS_BUTTON_STYLE}
      >
        ×
      </button>
    </div>
  );
}

const MobileAlertRow = memo(MobileAlertRowImpl);
