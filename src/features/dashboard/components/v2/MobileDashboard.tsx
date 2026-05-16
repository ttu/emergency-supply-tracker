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

export function MobileDashboard({ onCategorySelect }: MobileDashboardProps) {
  const { themeKey, voice } = useDesignTheme();
  const { totals, readiness, stats, expiringCount, criticalCount, rows } =
    useDesignData();
  const tone = readiness >= 80 ? 'ok' : readiness >= 60 ? 'warn' : 'crit';
  const priority = [...rows].filter((r) => r.status !== 'ok').slice(0, 4);
  const headline =
    themeKey === 'pantry'
      ? readiness >= 80
        ? 'Mostly ready'
        : 'Needs attention'
      : 'STATUS';

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div>
        <Caption>{voice.greeting}</Caption>
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
        <Caption>{voice.readiness}</Caption>
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
          <span style={{ color: 'var(--color-ok)' }}>{totals.ok} OK</span>
          <span style={{ color: 'var(--color-warn)' }}>
            {totals.warn} {voice.statusWarn}
          </span>
          <span style={{ color: 'var(--color-crit)' }}>
            {totals.crit} {voice.statusCrit}
          </span>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Panel padding={14}>
          <Caption>{voice.expiringSoon}</Caption>
          <div style={{ marginTop: 6 }}>
            <NumberDisplay
              value={expiringCount}
              size={32}
              tone={expiringCount > 0 ? 'warn' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={14}>
          <Caption>{voice.critical}</Caption>
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
            <Caption>
              {themeKey === 'pantry' ? 'Needs attention' : 'PRIORITY'}
            </Caption>
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
          <Caption>{themeKey === 'pantry' ? 'Categories' : 'COVERAGE'}</Caption>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {stats.slice(0, 6).map((s, i) => {
            const t = s.crit > 0 ? 'crit' : s.warn > 0 ? 'warn' : 'ok';
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
                  <StatusDot status={t} size={6} />
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
