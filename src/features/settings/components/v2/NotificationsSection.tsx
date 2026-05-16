import { useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
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

export function NotificationsSection() {
  const { themeKey } = useDesignTheme();
  const { t } = useTranslation();
  const { items, dismissedAlertIds, reactivateAlert, reactivateAllAlerts } =
    useInventory();
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();

  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs);
  const setPrefs = (k: keyof Prefs) => (v: boolean) => {
    const next = { ...prefs, [k]: v };
    setPrefsState(next);
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

  const isPantry = themeKey === 'pantry';

  return (
    <section id="sec-notifications" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§6"
        title={isPantry ? 'Notifications' : 'NOTIFICATIONS'}
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
            {isPantry ? 'In-app alerts' : 'IN-APP ALERTS · §6.1'}
          </PanelHeader>
          <ToggleRow
            label={isPantry ? 'Critical alerts' : 'CRITICAL ALERTS'}
            hint={isPantry ? 'Items missing or expired' : 'q = 0 OR EXPIRED'}
            on={prefs.critical}
            onChange={setPrefs('critical')}
          />
          <ToggleRow
            label={isPantry ? 'Low-stock warnings' : 'LOW-STOCK WARNINGS'}
            hint={isPantry ? 'Below 50% of recommended' : 'q < r · WARN'}
            on={prefs.lowStock}
            onChange={setPrefs('lowStock')}
          />
          <ToggleRow
            label={isPantry ? 'Expiry warnings' : 'EXPIRY WARNINGS'}
            hint={
              isPantry ? 'Items expiring within 30 days' : 'EXP ≤ 30D · WARN'
            }
            on={prefs.expiry}
            onChange={setPrefs('expiry')}
          />
          <ToggleRow
            label={isPantry ? 'Backup reminders' : 'BACKUP REMINDERS'}
            hint={
              isPantry
                ? "Monthly nudge if you haven't exported recently"
                : '30D SINCE LAST EXPORT'
            }
            on={prefs.backup}
            onChange={setPrefs('backup')}
            last
          />
        </Panel>

        {/* Email digest */}
        <Panel padding={0}>
          <PanelHeader>
            {isPantry ? 'Email digest' : 'EMAIL DIGEST · §6.2'}
          </PanelHeader>
          <ToggleRow
            label={isPantry ? 'Weekly summary' : 'WEEKLY SUMMARY'}
            hint={isPantry ? 'Mondays 09:00' : 'MON 09:00 EET'}
            on={prefs.weeklyEmail}
            onChange={setPrefs('weeklyEmail')}
          />
          <ReadField
            label={isPantry ? 'Audit reminder' : 'AUDIT CADENCE'}
            value={isPantry ? 'Monthly · 15th' : 'MONTHLY · 15TH'}
          />
          <ReadField
            label={isPantry ? 'Hidden alerts' : 'DISMISSED ALERTS'}
            value={
              hiddenAlerts.length === 0
                ? isPantry
                  ? 'None'
                  : 'NONE'
                : isPantry
                  ? `${hiddenAlerts.length} hidden`
                  : `${hiddenAlerts.length} HIDDEN`
            }
            hint={
              hiddenAlerts.length > 0
                ? isPantry
                  ? 'restore'
                  : 'RESTORE'
                : undefined
            }
            onAction={
              hiddenAlerts.length > 0 ? () => reactivateAllAlerts() : undefined
            }
            last
          />
        </Panel>
      </div>

      {/* Hidden alerts list */}
      {hiddenAlerts.length > 0 && (
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
              {isPantry
                ? 'Currently hidden alerts'
                : `HIDDEN ALERTS · ${hiddenAlerts.length} ACTIVE`}
            </Caption>
            <button
              type="button"
              onClick={reactivateAllAlerts}
              style={restoreAllStyle}
            >
              {isPantry ? 'Restore all' : 'RESTORE ALL'}
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
                {isPantry ? 'Restore' : 'RESTORE'}
              </Button>
            </div>
          ))}
        </Panel>
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
