import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Caption,
  NumberDisplay,
  Panel,
  StatusBar,
  StatusDot,
  StatusPill,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import { categoryCode } from '@/shared/i18n/voice';

interface MobileDashboardProps {
  onCategorySelect: (id: string) => void;
}

function mobileReadinessTone(readiness: number): 'ok' | 'warn' | 'crit' {
  if (readiness >= 80) return 'ok';
  if (readiness >= 60) return 'warn';
  return 'crit';
}

function pantryHeadline(readiness: number, t: TFunction): string {
  return readiness >= 80
    ? t('v2.dashboard.mobileHeadlinePantryReady')
    : t('v2.dashboard.mobileHeadlinePantryAttention');
}

function mobileHeadline(
  themeKey: string,
  readiness: number,
  t: TFunction,
): string {
  if (themeKey === 'pantry') return pantryHeadline(readiness, t);
  if (themeKey === 'civil') return t('v2.dashboard.mobileHeadlineCivil');
  return t('v2.dashboard.mobileHeadlineCockpit');
}

function mobileStatTone(s: {
  crit: number;
  warn: number;
}): 'crit' | 'warn' | 'ok' {
  if (s.crit > 0) return 'crit';
  if (s.warn > 0) return 'warn';
  return 'ok';
}

export function MobileDashboard({
  onCategorySelect,
}: Readonly<MobileDashboardProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { totals, readiness, stats, expiringCount, criticalCount, rows } =
    useDesignData();
  const tone = mobileReadinessTone(readiness);
  const priority = [...rows].filter((r) => r.status !== 'ok').slice(0, 4);
  const headline = mobileHeadline(themeKey, readiness, t);

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div>
        <Caption>{t(`v2.voice.greeting.${themeKey}`)}</Caption>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: themeKey === 'pantry' ? 400 : 600,
            letterSpacing: '-0.02em',
            marginTop: 6,
            color: 'var(--color-text)',
          }}
        >
          {headline}
        </div>
      </div>

      <Panel padding={16}>
        <Caption>{t(`v2.voice.readiness.${themeKey}`)}</Caption>
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <NumberDisplay value={readiness} suffix="%" size={48} tone={tone} />
        </div>
        <div style={{ marginTop: 12 }}>
          <StatusBar
            ok={totals.ok}
            warn={totals.warn}
            crit={totals.crit}
            total={Math.max(totals.total, 1)}
            height={5}
          />
        </div>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
          }}
        >
          <span style={{ color: 'var(--color-ok)' }}>
            {totals.ok} {t(`v2.voice.statusOk.${themeKey}`)}
          </span>
          <span style={{ color: 'var(--color-warn)' }}>
            {totals.warn} {t(`v2.voice.statusWarn.${themeKey}`)}
          </span>
          <span style={{ color: 'var(--color-crit)' }}>
            {totals.crit} {t(`v2.voice.statusCrit.${themeKey}`)}
          </span>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Panel padding={14}>
          <Caption>{t(`v2.voice.expiringSoon.${themeKey}`)}</Caption>
          <div style={{ marginTop: 6 }}>
            <NumberDisplay
              value={expiringCount}
              size={32}
              tone={expiringCount > 0 ? 'warn' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={14}>
          <Caption>{t(`v2.voice.critical.${themeKey}`)}</Caption>
          <div style={{ marginTop: 6 }}>
            <NumberDisplay
              value={criticalCount}
              size={32}
              tone={criticalCount > 0 ? 'crit' : 'ok'}
            />
          </div>
        </Panel>
      </div>

      {priority.length > 0 && (
        <Panel padding={0}>
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--color-rule-soft)',
            }}
          >
            <Caption>{t(`v2.dashboard.mobilePriority.${themeKey}`)}</Caption>
          </div>
          {priority.map((r, i) => (
            <div
              key={String(r.item.id)}
              style={{
                padding: '11px 14px',
                display: 'grid',
                gridTemplateColumns: '14px 1fr auto',
                gap: 10,
                alignItems: 'center',
                borderBottom:
                  i < priority.length - 1
                    ? '1px solid var(--color-rule-soft)'
                    : 'none',
              }}
            >
              <StatusDot status={r.status} size={7} />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-text)',
                  }}
                >
                  {r.item.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-3)',
                    marginTop: 1,
                  }}
                >
                  {r.item.quantity}/{r.recommended || '—'} {r.item.unit}
                </div>
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </Panel>
      )}

      <Panel padding={0}>
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--color-rule-soft)',
          }}
        >
          <Caption>{t(`v2.dashboard.mobileCoverage.${themeKey}`)}</Caption>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {stats.slice(0, 6).map((s, i) => {
            const tn = mobileStatTone(s);
            return (
              <button
                key={String(s.category.id)}
                type="button"
                onClick={() => onCategorySelect(String(s.category.id))}
                style={{
                  padding: '12px 14px',
                  borderRight:
                    i % 2 === 0 ? '1px solid var(--color-rule-soft)' : 'none',
                  borderBottom:
                    i < 4 ? '1px solid var(--color-rule-soft)' : 'none',
                  background: 'transparent',
                  border: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'inherit',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-text-3)',
                    }}
                  >
                    {categoryCode(String(s.category.id))}
                  </span>
                  <StatusDot status={tn} size={6} />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginTop: 4,
                    color: 'var(--color-text)',
                  }}
                >
                  {s.category.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    color: 'var(--color-text-2)',
                    marginTop: 4,
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {s.ok}/{s.total}
                </div>
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
