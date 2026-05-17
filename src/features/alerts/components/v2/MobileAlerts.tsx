import {
  Caption,
  NumberDisplay,
  Panel,
  StatusDot,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDashboardAlerts } from '@/features/dashboard';
import type { AlertType } from '@/features/alerts';
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

function resolveAlertClick(
  alert: { categoryId?: string | number; itemId?: string },
  onItemSelect: (id: string) => void,
  onCategorySelect: (id: string) => void,
): (() => void) | undefined {
  if (alert.categoryId) return () => onCategorySelect(String(alert.categoryId));
  if (alert.itemId) return () => onItemSelect(alert.itemId!);
  return undefined;
}

export function MobileAlerts({
  onItemSelect,
  onCategorySelect,
}: Readonly<MobileAlertsProps>) {
  const { themeKey, voice } = useDesignTheme();
  const { activeAlerts, handleDismissAlert } = useDashboardAlerts();
  const counts = {
    crit: activeAlerts.filter((a) => a.type === 'critical').length,
    warn: activeAlerts.filter((a) => a.type === 'warning').length,
    info: activeAlerts.filter((a) => a.type === 'info').length,
  };

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        <Panel padding={12}>
          <Caption>{voice.critical}</Caption>
          <div style={{ marginTop: 4 }}>
            <NumberDisplay
              value={counts.crit}
              size={24}
              tone={counts.crit > 0 ? 'crit' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={12}>
          <Caption>{voice.warning}</Caption>
          <div style={{ marginTop: 4 }}>
            <NumberDisplay
              value={counts.warn}
              size={24}
              tone={counts.warn > 0 ? 'warn' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={12}>
          <Caption>{themeKey === 'pantry' ? 'Info' : 'INFO'}</Caption>
          <div style={{ marginTop: 4 }}>
            <NumberDisplay value={counts.info} size={24} />
          </div>
        </Panel>
      </div>
      <Panel padding={0}>
        {activeAlerts.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--color-text-2)',
            }}
          >
            {themeKey === 'pantry' ? 'All clear.' : 'NOMINAL'}
          </div>
        )}
        {activeAlerts.map((a, i) => (
          <div
            key={String(a.id)}
            style={{
              padding: '12px 14px',
              display: 'grid',
              gridTemplateColumns: '12px 1fr auto',
              gap: 10,
              alignItems: 'center',
              borderBottom:
                i < activeAlerts.length - 1
                  ? '1px solid var(--color-rule-soft)'
                  : 'none',
            }}
          >
            <div style={{ marginTop: 5 }}>
              <StatusDot status={ALERT_TYPE_TO_DOT[a.type]} size={7} />
            </div>
            <button
              type="button"
              onClick={resolveAlertClick(a, onItemSelect, onCategorySelect)}
              disabled={!a.categoryId && !a.itemId}
              style={{
                background: 'transparent',
                border: 0,
                textAlign: 'left',
                fontFamily: 'inherit',
                color: 'inherit',
                cursor: a.categoryId || a.itemId ? 'pointer' : 'default',
                padding: 0,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}
              >
                {a.itemName ?? a.message}
              </div>
              {a.itemName && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-2)',
                    marginTop: 3,
                  }}
                >
                  {a.message}
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleDismissAlert(a.id)}
              aria-label="Dismiss alert"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-rule)',
                color: 'var(--color-text-3)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                padding: '3px 8px',
                cursor: 'pointer',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </Panel>
    </div>
  );
}
