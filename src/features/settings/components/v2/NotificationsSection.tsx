import { useMemo, useState, type CSSProperties } from 'react';
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
import { generateDashboardAlerts } from '@/features/alerts';

// TODO(v2-release): These notification preferences are persisted to
// localStorage but no consumer reads them — generateDashboardAlerts ignores
// the toggles. Either wire the prefs into alert generation (drop alerts the
// user opted out of) or remove the in-app-alerts panel before release.
// `weeklyEmail` + the "audit cadence" ReadField additionally surface a
// feature (email digest) for which the app has no backend at all and should
// be removed or gated behind a future server-side build.
// See docs/V2_RELEASE_TODO.md.
const PREFS_KEY = 'est:design:notification-prefs';

interface Prefs {
  critical: boolean;
  lowStock: boolean;
  expiry: boolean;
  backup: boolean;
  weeklyEmail: boolean;
}
const DEFAULT_PREFS: Prefs = {
  critical: true,
  lowStock: true,
  expiry: true,
  backup: true,
  weeklyEmail: false,
};
function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}
function savePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

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

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const togglePref = (k: keyof Prefs) => (v: boolean) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    savePrefs(next);
  };

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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        {/* In-app alerts */}
        <Panel padding={0}>
          <PanelHeader>
            {t(`v2.settings.notifications.inAppHeader.${themeKey}`)}
          </PanelHeader>
          <ToggleRow
            label={t(`v2.settings.notifications.critical.${themeKey}`)}
            hint={t(`v2.settings.notifications.criticalHint.${themeKey}`)}
            on={prefs.critical}
            onChange={togglePref('critical')}
          />
          <ToggleRow
            label={t(`v2.settings.notifications.lowStock.${themeKey}`)}
            hint={t(`v2.settings.notifications.lowStockHint.${themeKey}`)}
            on={prefs.lowStock}
            onChange={togglePref('lowStock')}
          />
          <ToggleRow
            label={t(`v2.settings.notifications.expiry.${themeKey}`)}
            hint={t(`v2.settings.notifications.expiryHint.${themeKey}`)}
            on={prefs.expiry}
            onChange={togglePref('expiry')}
          />
          <ToggleRow
            label={t(`v2.settings.notifications.backup.${themeKey}`)}
            hint={t(`v2.settings.notifications.backupHint.${themeKey}`)}
            on={prefs.backup}
            onChange={togglePref('backup')}
            last
          />
        </Panel>

        {/* Email digest */}
        <Panel padding={0}>
          <PanelHeader>
            {t(`v2.settings.notifications.emailHeader.${themeKey}`)}
          </PanelHeader>
          <ToggleRow
            label={t(`v2.settings.notifications.weekly.${themeKey}`)}
            hint={t(`v2.settings.notifications.weeklyHint.${themeKey}`)}
            on={prefs.weeklyEmail}
            onChange={togglePref('weeklyEmail')}
          />
          <ReadField
            label={t(`v2.settings.notifications.audit.${themeKey}`)}
            value={t(`v2.settings.notifications.auditValue.${themeKey}`)}
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
      </div>

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
