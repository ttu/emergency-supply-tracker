import { memo, useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Caption,
  NumberDisplay,
  Panel,
  StatusDot,
  Title,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDashboardAlerts } from '@/features/dashboard';
import type { Alert, AlertType } from '@/features/alerts';
import type { AlertId } from '@/shared/types';
import type { DesignStatus } from '@/shared/utils/designStatus';

interface AlertsProps {
  onItemSelect: (id: string) => void;
  onCategorySelect: (categoryId: string) => void;
}

const TYPE_TO_DOT: Record<AlertType, DesignStatus> = {
  critical: 'crit',
  warning: 'warn',
  info: 'ok',
};

const CONTAINER_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const COUNTS_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 16,
};

const COUNT_TILE_VALUE_STYLE: CSSProperties = { marginTop: 10 };

const EVENT_STREAM_HEADER_STYLE: CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid var(--color-rule-soft)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
};

const EMPTY_STATE_STYLE: CSSProperties = {
  padding: 32,
  textAlign: 'center',
  color: 'var(--color-text-2)',
};

const HIDDEN_FOOTER_STYLE: CSSProperties = {
  padding: '12px 20px',
  borderTop: '1px solid var(--color-rule-soft)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
};

const HIDDEN_COUNT_LABEL_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--color-text-3)',
  letterSpacing: '0.06em',
};

const ROW_BASE_STYLE: CSSProperties = {
  padding: '14px 20px',
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 14,
  alignItems: 'center',
};

const CONTENT_GRID_BASE_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '70px 16px 90px 1fr',
  gap: 14,
  alignItems: 'center',
  background: 'transparent',
  border: 0,
  padding: 0,
  margin: 0,
  textAlign: 'left',
  font: 'inherit',
  color: 'inherit',
  minWidth: 0,
  width: '100%',
};

const ROW_CODE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-3)',
};
const ROW_DATE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--color-text-3)',
};
const ROW_TITLE_WRAP_STYLE: CSSProperties = { minWidth: 0 };
const ROW_TITLE_STYLE: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
};
const ROW_MESSAGE_STYLE: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-2)',
  marginTop: 2,
};
const ROW_ACTIONS_STYLE: CSSProperties = {
  display: 'flex',
  gap: 6,
  justifyContent: 'flex-end',
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
};

const DISMISS_ALL_STYLE: CSSProperties = {
  background: 'transparent',
  border: 0,
  color: 'var(--color-accent)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  padding: 0,
  cursor: 'pointer',
  letterSpacing: '0.08em',
  fontWeight: 700,
};

export function Alerts({
  onItemSelect,
  onCategorySelect,
}: Readonly<AlertsProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const {
    activeAlerts,
    hiddenAlertsCount,
    handleDismissAlert,
    handleDismissAllAlerts,
    handleShowAllAlerts,
  } = useDashboardAlerts();

  const counts = useMemo(
    () => ({
      crit: activeAlerts.filter((a) => a.type === 'critical').length,
      warn: activeAlerts.filter((a) => a.type === 'warning').length,
      info: activeAlerts.filter((a) => a.type === 'info').length,
    }),
    [activeAlerts],
  );

  // Alerts have no createdAt; the log aesthetic shows today's date for every row.
  const today = new Date().toISOString().slice(0, 10);

  const resolveLabel = t(`v2.voice.resolveAction.${themeKey}`);
  const dismissLabel = t(`v2.alerts.dismiss.${themeKey}`);

  return (
    <div style={CONTAINER_STYLE}>
      <div>
        <Caption>{t(`v2.voice.alerts.${themeKey}`)}</Caption>
        <Title size={32} style={{ marginTop: 4 }}>
          {t(`v2.alerts.title.${themeKey}`)}
        </Title>
      </div>

      <div style={COUNTS_GRID_STYLE}>
        <Panel padding={20}>
          <Caption>{t(`v2.voice.critical.${themeKey}`)}</Caption>
          <div style={COUNT_TILE_VALUE_STYLE}>
            <NumberDisplay
              value={counts.crit}
              size={48}
              tone={counts.crit > 0 ? 'crit' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={20}>
          <Caption>{t(`v2.voice.warning.${themeKey}`)}</Caption>
          <div style={COUNT_TILE_VALUE_STYLE}>
            <NumberDisplay
              value={counts.warn}
              size={48}
              tone={counts.warn > 0 ? 'warn' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={20}>
          <Caption>{t(`v2.alerts.info.${themeKey}`)}</Caption>
          <div style={COUNT_TILE_VALUE_STYLE}>
            <NumberDisplay value={counts.info} size={48} />
          </div>
        </Panel>
      </div>

      <Panel padding={0}>
        <div style={EVENT_STREAM_HEADER_STYLE}>
          <Caption>{t(`v2.alerts.eventStream.${themeKey}`)}</Caption>
          {activeAlerts.length > 0 && (
            <button
              type="button"
              onClick={handleDismissAllAlerts}
              style={DISMISS_ALL_STYLE}
            >
              {t(`v2.alerts.dismissAll.${themeKey}`)}
            </button>
          )}
        </div>

        {activeAlerts.length === 0 && (
          <div style={EMPTY_STATE_STYLE}>
            {t(`v2.alerts.empty.${themeKey}`)}
          </div>
        )}

        {activeAlerts.map((a, i) => (
          <AlertRow
            key={String(a.id)}
            alert={a}
            code={`A-${String(i + 1).padStart(3, '0')}`}
            date={today}
            isLast={i === activeAlerts.length - 1}
            onDismiss={handleDismissAlert}
            onSelectItem={onItemSelect}
            onSelectCategory={onCategorySelect}
            resolveLabel={resolveLabel}
            dismissLabel={dismissLabel}
          />
        ))}

        {hiddenAlertsCount > 0 && (
          <div style={HIDDEN_FOOTER_STYLE}>
            <span style={HIDDEN_COUNT_LABEL_STYLE}>
              {t(`v2.alerts.hiddenCount.${themeKey}`, {
                count: hiddenAlertsCount,
              })}
            </span>
            <Button variant="secondary" onClick={handleShowAllAlerts}>
              {t(`v2.alerts.restoreAll.${themeKey}`)}
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
}

interface AlertRowProps {
  alert: Alert;
  code: string;
  date: string;
  isLast: boolean;
  onDismiss: (id: AlertId) => void;
  onSelectItem: (id: string) => void;
  onSelectCategory: (categoryId: string) => void;
  resolveLabel: string;
  dismissLabel: string;
}

function AlertRowImpl({
  alert,
  code,
  date,
  isLast,
  onDismiss,
  onSelectItem,
  onSelectCategory,
  resolveLabel,
  dismissLabel,
}: Readonly<AlertRowProps>) {
  const hasRowAction = !!(alert.categoryId || alert.itemId);
  const hasResolveButton = !!alert.itemId;

  const handleRowClick = () => {
    if (alert.categoryId) onSelectCategory(String(alert.categoryId));
    else if (alert.itemId) onSelectItem(alert.itemId);
  };
  const handleResolve = () => {
    if (alert.itemId) onSelectItem(alert.itemId);
  };
  const handleDismiss = () => onDismiss(alert.id);

  const rowStyle: CSSProperties = {
    ...ROW_BASE_STYLE,
    borderBottom: isLast ? 'none' : '1px solid var(--color-rule-soft)',
  };
  const contentGridStyle: CSSProperties = {
    ...CONTENT_GRID_BASE_STYLE,
    cursor: hasRowAction ? 'pointer' : 'default',
  };

  const content = (
    <>
      <span style={ROW_CODE_STYLE}>{code}</span>
      <StatusDot status={TYPE_TO_DOT[alert.type]} size={8} />
      <span style={ROW_DATE_STYLE}>{date}</span>
      <div style={ROW_TITLE_WRAP_STYLE}>
        <div style={ROW_TITLE_STYLE}>{alert.itemName ?? alert.message}</div>
        {alert.itemName && <div style={ROW_MESSAGE_STYLE}>{alert.message}</div>}
      </div>
    </>
  );
  return (
    <div style={rowStyle}>
      {hasRowAction ? (
        <button type="button" onClick={handleRowClick} style={contentGridStyle}>
          {content}
        </button>
      ) : (
        <div style={contentGridStyle}>{content}</div>
      )}
      <div style={ROW_ACTIONS_STYLE}>
        {hasResolveButton && (
          <button
            type="button"
            onClick={handleResolve}
            style={PILL_BUTTON_STYLE}
          >
            {resolveLabel}
          </button>
        )}
        <button type="button" onClick={handleDismiss} style={PILL_BUTTON_STYLE}>
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}

const AlertRow = memo(AlertRowImpl);
