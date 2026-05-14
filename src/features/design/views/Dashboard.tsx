import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Caption,
  NumberDisplay,
  Panel,
  StatusBar,
  StatusDot,
  StatusPill,
  Title,
} from '../primitives';
import { useDesignTheme } from '../useDesignTheme';
import { useDesignData } from '../useDesignData';
import { categoryCode } from '../voice';
import type { CategoryId } from '@/shared/types';

interface DashboardProps {
  onCategorySelect: (categoryId: string) => void;
  onViewAllPriority: () => void;
}

export function Dashboard({
  onCategorySelect,
  onViewAllPriority,
}: DashboardProps) {
  const { i18n } = useTranslation();
  const { themeKey, voice } = useDesignTheme();
  const data = useDesignData();
  const {
    totals,
    readiness,
    stats,
    expiringCount,
    criticalCount,
    daysCovered,
    rows,
  } = data;
  const tone = readiness >= 80 ? 'ok' : readiness >= 60 ? 'warn' : 'crit';

  const priority = [...rows]
    .filter((r) => r.status !== 'ok')
    .sort((a, b) => (a.status === 'crit' ? -1 : b.status === 'crit' ? 1 : 0))
    .slice(0, 5);

  const heroTitle =
    themeKey === 'pantry'
      ? readiness >= 80
        ? 'Your household is mostly ready'
        : readiness >= 50
          ? 'A few things need attention'
          : 'Your kit needs work'
      : themeKey === 'civil'
        ? 'HOUSEHOLD READINESS REPORT'
        : 'HOUSEHOLD STATUS';

  const lang = i18n.language || 'en';
  const categoryName = (id: CategoryId, fallback: string) => {
    const cat = data.categories.find((c) => c.id === id);
    return cat?.names?.[lang] ?? cat?.name ?? fallback;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Caption>{voice.greeting}</Caption>
        <Title size={36} style={{ marginTop: 6 }}>
          {heroTitle}
        </Title>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}
      >
        <Panel padding={20}>
          <Caption>{voice.readiness}</Caption>
          <div style={{ marginTop: 12 }}>
            <NumberDisplay value={readiness} suffix="%" size={56} tone={tone} />
          </div>
          <div style={{ marginTop: 12 }}>
            <StatusBar
              ok={totals.ok}
              warn={totals.warn}
              crit={totals.crit}
              total={Math.max(totals.total, 1)}
              height={6}
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
            <span style={{ color: 'var(--color-ok)' }}>{totals.ok} OK</span>
            <span style={{ color: 'var(--color-warn)' }}>
              {totals.warn} WARN
            </span>
            <span style={{ color: 'var(--color-crit)' }}>
              {totals.crit} CRIT
            </span>
          </div>
        </Panel>
        <Panel padding={20}>
          <Caption>{voice.daysCovered}</Caption>
          <div style={{ marginTop: 12 }}>
            <NumberDisplay value={daysCovered.toFixed(1)} size={56} />
          </div>
          <div
            style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-2)' }}
          >
            {themeKey === 'pantry' ? 'Goal: 7 days' : 'TARGET: 7D'}
          </div>
        </Panel>
        <Panel padding={20}>
          <Caption>{voice.expiringSoon}</Caption>
          <div style={{ marginTop: 12 }}>
            <NumberDisplay
              value={expiringCount}
              size={56}
              tone={expiringCount > 0 ? 'warn' : undefined}
            />
          </div>
          <div
            style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-2)' }}
          >
            {themeKey === 'pantry' ? 'Items to use up' : 'NEXT 30 DAYS'}
          </div>
        </Panel>
        <Panel padding={20}>
          <Caption>{voice.critical}</Caption>
          <div style={{ marginTop: 12 }}>
            <NumberDisplay
              value={criticalCount}
              size={56}
              tone={criticalCount > 0 ? 'crit' : 'ok'}
            />
          </div>
          <div
            style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-2)' }}
          >
            {themeKey === 'pantry' ? 'Need attention now' : 'ACTION REQUIRED'}
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
          }}
        >
          <Caption>
            {themeKey === 'pantry'
              ? 'Coverage by category'
              : 'COVERAGE MATRIX · ALL CATEGORIES'}
          </Caption>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-3)',
            }}
          >
            {stats.length} / {stats.length}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {stats.map((s, i) => {
            const tone = s.crit > 0 ? 'crit' : s.warn > 0 ? 'warn' : 'ok';
            const cellStyle: CSSProperties = {
              padding: '16px 18px',
              borderRight:
                (i + 1) % 5 !== 0 ? '1px solid var(--color-rule-soft)' : 'none',
              borderBottom:
                i < Math.floor((stats.length - 1) / 5) * 5
                  ? '1px solid var(--color-rule-soft)'
                  : 'none',
              cursor: 'pointer',
              background: 'transparent',
              textAlign: 'left',
              border: 0,
              fontFamily: 'inherit',
              color: 'inherit',
            };
            return (
              <button
                key={String(s.category.id)}
                type="button"
                onClick={() => onCategorySelect(String(s.category.id))}
                style={cellStyle}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--color-text-3)',
                    }}
                  >
                    {categoryCode(String(s.category.id))}
                  </span>
                  <StatusDot status={tone} size={6} />
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {categoryName(s.category.id, s.category.name)}
                </div>
                <div style={{ marginTop: 10 }}>
                  <span
                    style={{
                      fontFamily: 'var(--display-number-font)',
                      fontSize: 24,
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {s.ok}/{s.total}
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <StatusBar
                    ok={s.ok}
                    warn={s.warn}
                    crit={s.crit}
                    total={Math.max(s.total, 1)}
                    height={3}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel padding={0}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-rule-soft)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Caption>
            {themeKey === 'pantry'
              ? 'Needs your attention'
              : 'PRIORITY QUEUE · TOP ACTIONS'}
          </Caption>
          <button
            type="button"
            onClick={onViewAllPriority}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-accent)',
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            VIEW ALL →
          </button>
        </div>
        {priority.length === 0 && (
          <div
            style={{
              padding: 24,
              color: 'var(--color-text-2)',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {themeKey === 'pantry'
              ? 'Nothing urgent. Nice work.'
              : 'NOMINAL · NO ACTION ITEMS'}
          </div>
        )}
        {priority.map((r, i) => (
          <div
            key={String(r.item.id)}
            style={{
              padding: '14px 20px',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: 14,
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
                  marginTop: 2,
                }}
              >
                {r.categoryCode} · {r.item.quantity} of {r.recommended || '—'}{' '}
                {r.item.unit}
                {r.item.expirationDate ? ` · exp ${r.item.expirationDate}` : ''}
              </div>
            </div>
            <StatusPill status={r.status} />
          </div>
        ))}
      </Panel>
    </div>
  );
}
