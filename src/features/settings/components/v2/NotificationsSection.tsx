import { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Button, Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import {
  Caption,
  PanelHeader,
  SectionHeader,
  ToggleRow,
  ReadField,
} from './SettingsRows';
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import {
  generateDashboardAlerts,
  useNotificationPrefs,
} from '@/features/alerts';

function hiddenAlertsValue(
  themeKey: string,
  count: number,
  t: TFunction,
): string {
  if (count === 0) return t(`v2.settings.notifications.hiddenNone.${themeKey}`);
  return t(`v2.settings.notifications.hiddenCount.${themeKey}`, { count });
}

function hiddenAlertsHint(
  themeKey: string,
  count: number,
  t: TFunction,
): string | undefined {
  if (count === 0) return undefined;
  return t(`v2.settings.notifications.hiddenRestoreAction.${themeKey}`);
}

interface HiddenAlertsPanelProps {
  themeKey: string;
  t: TFunction;
  hiddenAlerts: ReturnType<typeof generateDashboardAlerts>;
  reactivateAlert: (
    id: ReturnType<typeof generateDashboardAlerts>[number]['id'],
  ) => void;
  reactivateAllAlerts: () => void;
}

function HiddenAlertsPanel({
  themeKey,
  t,
  hiddenAlerts,
  reactivateAlert,
  reactivateAllAlerts,
}: Readonly<HiddenAlertsPanelProps>) {
  return (
    <Panel padding={0} style={{ marginTop: 14 }}>
      <div
        style={{
          padding: '14px 22px',
          borderBottom: '1px solid var(--color-rule-soft)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Caption>
          {t(`v2.settings.notifications.hiddenPanelCaption.${themeKey}`, {
            count: hiddenAlerts.length,
          })}
        </Caption>
        <button
          type="button"
          onClick={reactivateAllAlerts}
          style={restoreAllStyle}
        >
          {t(`v2.settings.notifications.restoreAll.${themeKey}`)}
        </button>
      </div>
      {hiddenAlerts.map((a, i) => (
        <div
          key={String(a.id)}
          style={{
            padding: '12px 22px',
            display: 'grid',
            gridTemplateColumns: '70px 1fr auto',
            gap: 14,
            alignItems: 'center',
            borderBottom:
              i < hiddenAlerts.length - 1
                ? '1px solid var(--color-rule-soft)'
                : 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-3)',
            }}
          >
            {`A-${String(i + 1).padStart(3, '0')}`}
          </span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-text)',
              }}
            >
              {a.itemName ?? a.message}
            </div>
            {a.itemName && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-3)',
                  marginTop: 2,
                }}
              >
                {a.message}
              </div>
            )}
          </div>
          <Button variant="secondary" onClick={() => reactivateAlert(a.id)}>
            {t(`v2.settings.notifications.restoreSingle.${themeKey}`)}
          </Button>
        </div>
      ))}
    </Panel>
  );
}

export function NotificationsSection() {
  const { themeKey } = useDesignTheme();
  const { t } = useTranslation();
  const { items, dismissedAlertIds, reactivateAlert, reactivateAllAlerts } =
    useInventory();
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();
  const [prefs, setPref] = useNotificationPrefs();

  // Compute hidden alerts off the unfiltered alert set so the user can
  // restore an alert even if its category is currently toggled off.
  const allAlerts = useMemo(
    () => generateDashboardAlerts(items, t, household, recommendedItems),
    [items, t, household, recommendedItems],
  );
  const hiddenAlerts = useMemo(() => {
    const dismissed = new Set(dismissedAlertIds);
    return allAlerts.filter((a) => dismissed.has(a.id));
  }, [allAlerts, dismissedAlertIds]);

  return (
    <section id="sec-notifications" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§6"
        title={t(`v2.settings.notifications.title.${themeKey}`)}
      />

      <Panel padding={0}>
        <PanelHeader>
          {t(`v2.settings.notifications.inAppHeader.${themeKey}`)}
        </PanelHeader>
        <ToggleRow
          label={t(`v2.settings.notifications.critical.${themeKey}`)}
          hint={t(`v2.settings.notifications.criticalHint.${themeKey}`)}
          on={prefs.critical}
          onChange={(v) => setPref('critical', v)}
        />
        <ToggleRow
          label={t(`v2.settings.notifications.lowStock.${themeKey}`)}
          hint={t(`v2.settings.notifications.lowStockHint.${themeKey}`)}
          on={prefs.lowStock}
          onChange={(v) => setPref('lowStock', v)}
        />
        <ToggleRow
          label={t(`v2.settings.notifications.expiry.${themeKey}`)}
          hint={t(`v2.settings.notifications.expiryHint.${themeKey}`)}
          on={prefs.expiry}
          onChange={(v) => setPref('expiry', v)}
        />
        <ToggleRow
          label={t(`v2.settings.notifications.backup.${themeKey}`)}
          hint={t(`v2.settings.notifications.backupHint.${themeKey}`)}
          on={prefs.backup}
          onChange={(v) => setPref('backup', v)}
        />
        <ReadField
          label={t(`v2.settings.notifications.hidden.${themeKey}`)}
          value={hiddenAlertsValue(themeKey, hiddenAlerts.length, t)}
          hint={hiddenAlertsHint(themeKey, hiddenAlerts.length, t)}
          onAction={
            hiddenAlerts.length > 0 ? () => reactivateAllAlerts() : undefined
          }
          last
        />
      </Panel>

      {hiddenAlerts.length > 0 && (
        <HiddenAlertsPanel
          themeKey={themeKey}
          t={t}
          hiddenAlerts={hiddenAlerts}
          reactivateAlert={reactivateAlert}
          reactivateAllAlerts={reactivateAllAlerts}
        />
      )}
    </section>
  );
}

const restoreAllStyle: CSSProperties = {
  background: 'transparent',
  border: 0,
  color: 'var(--color-accent)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.08em',
  fontWeight: 700,
  cursor: 'pointer',
  padding: 0,
};
