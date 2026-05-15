import { useMemo, type CSSProperties } from 'react';
import {
  Button,
  Caption,
  NumberDisplay,
  Panel,
  StatusDot,
  Title,
} from '../primitives';
import { useDesignTheme } from '../useDesignTheme';
import { useDashboardAlerts } from '@/features/dashboard';
import type { Alert, AlertType } from '@/features/alerts';
import type { DesignStatus } from '../status';

interface AlertsProps {
  onItemSelect: (id: string) => void;
}

const TYPE_TO_DOT: Record<AlertType, DesignStatus> = {
  critical: 'crit',
  warning: 'warn',
  info: 'ok',
};

export function Alerts({ onItemSelect }: AlertsProps) {
  const { themeKey, voice } = useDesignTheme();
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

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Caption>{voice.alerts}</Caption>
        <Title size={32} style={{ marginTop: 4 }}>
          {themeKey === 'pantry' ? 'What needs attention' : 'ALERTS · LOG'}
        </Title>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        <Panel padding={20}>
          <Caption>{voice.critical}</Caption>
          <div style={{ marginTop: 10 }}>
            <NumberDisplay
              value={counts.crit}
              size={48}
              tone={counts.crit > 0 ? 'crit' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={20}>
          <Caption>{voice.warning}</Caption>
          <div style={{ marginTop: 10 }}>
            <NumberDisplay
              value={counts.warn}
              size={48}
              tone={counts.warn > 0 ? 'warn' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={20}>
          <Caption>{themeKey === 'pantry' ? 'Info' : 'INFO'}</Caption>
          <div style={{ marginTop: 10 }}>
            <NumberDisplay value={counts.info} size={48} />
          </div>
        </Panel>
      </div>

      <Panel padding={0}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-rule-soft)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Caption>
            {themeKey === 'pantry'
              ? 'Latest first'
              : 'EVENT STREAM · NEWEST FIRST'}
          </Caption>
          {activeAlerts.length > 0 && (
            <button
              type="button"
              onClick={handleDismissAllAlerts}
              style={dismissAllStyle}
            >
              {themeKey === 'pantry' ? 'Dismiss all' : 'DISMISS ALL'}
            </button>
          )}
        </div>

        {activeAlerts.length === 0 && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--color-text-2)',
            }}
          >
            {themeKey === 'pantry'
              ? 'All clear. Nothing to act on.'
              : 'NOMINAL · ZERO ACTIVE ALERTS'}
          </div>
        )}

        {activeAlerts.map((a: Alert, i) => (
          <AlertRow
            key={String(a.id)}
            alert={a}
            code={`A-${String(i + 1).padStart(3, '0')}`}
            date={today}
            isLast={i === activeAlerts.length - 1}
            onDismiss={() => handleDismissAlert(a.id)}
            onItemSelect={a.itemId ? () => onItemSelect(a.itemId!) : undefined}
            resolveLabel={voice.resolveAction}
            dismissLabel={themeKey === 'pantry' ? 'Dismiss' : 'DISMISS'}
          />
        ))}

        {hiddenAlertsCount > 0 && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--color-rule-soft)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-3)',
                letterSpacing: '0.06em',
              }}
            >
              {themeKey === 'pantry'
                ? `${hiddenAlertsCount} hidden`
                : `${hiddenAlertsCount} HIDDEN`}
            </span>
            <Button variant="secondary" onClick={handleShowAllAlerts}>
              {themeKey === 'pantry' ? 'Restore all' : 'RESTORE ALL'}
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
}

function AlertRow({
  alert,
  code,
  date,
  isLast,
  onDismiss,
  onItemSelect,
  resolveLabel,
  dismissLabel,
}: {
  alert: Alert;
  code: string;
  date: string;
  isLast: boolean;
  onDismiss: () => void;
  onItemSelect?: () => void;
  resolveLabel: string;
  dismissLabel: string;
}) {
  const rowStyle: CSSProperties = {
    padding: '14px 20px',
    display: 'grid',
    gridTemplateColumns: '70px 16px 90px 1fr auto',
    gap: 14,
    alignItems: 'center',
    borderBottom: isLast ? 'none' : '1px solid var(--color-rule-soft)',
  };
  return (
    <div style={rowStyle}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-text-3)',
        }}
      >
        {code}
      </span>
      <StatusDot status={TYPE_TO_DOT[alert.type]} size={8} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-3)',
        }}
      >
        {date}
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          {alert.itemName ?? alert.message}
        </div>
        {alert.itemName && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-2)',
              marginTop: 2,
            }}
          >
            {alert.message}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {onItemSelect && (
          <button type="button" onClick={onItemSelect} style={pillButtonStyle}>
            {resolveLabel}
          </button>
        )}
        <button type="button" onClick={onDismiss} style={pillButtonStyle}>
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}

const pillButtonStyle: CSSProperties = {
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

const dismissAllStyle: CSSProperties = {
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
