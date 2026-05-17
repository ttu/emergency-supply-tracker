import { StatusBar } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import { KpiTile } from './KpiTile';

function readinessTone(readiness: number): 'ok' | 'warn' | 'crit' {
  if (readiness >= 80) return 'ok';
  if (readiness >= 60) return 'warn';
  return 'crit';
}

/**
 * The four-up KPI row at the top of the Dashboard:
 * Readiness / Days covered / Expiring / Critical.
 */
export function KpiRow() {
  const { themeKey, voice } = useDesignTheme();
  const { totals, readiness, expiringCount, criticalCount, daysCovered } =
    useDesignData();
  const tone = readinessTone(readiness);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
      }}
    >
      <KpiTile label={voice.readiness} value={readiness} suffix="%" tone={tone}>
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
          <span style={{ color: 'var(--color-warn)' }}>{totals.warn} WARN</span>
          <span style={{ color: 'var(--color-crit)' }}>{totals.crit} CRIT</span>
        </div>
      </KpiTile>

      <KpiTile label={voice.daysCovered} value={daysCovered.toFixed(1)}>
        <div
          style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-2)' }}
        >
          {themeKey === 'pantry' ? 'Goal: 7 days' : 'TARGET: 7D'}
        </div>
      </KpiTile>

      <KpiTile
        label={voice.expiringSoon}
        value={expiringCount}
        tone={expiringCount > 0 ? 'warn' : undefined}
      >
        <div
          style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-2)' }}
        >
          {themeKey === 'pantry' ? 'Items to use up' : 'NEXT 30 DAYS'}
        </div>
      </KpiTile>

      <KpiTile
        label={voice.critical}
        value={criticalCount}
        tone={criticalCount > 0 ? 'crit' : 'ok'}
      >
        <div
          style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-2)' }}
        >
          {themeKey === 'pantry' ? 'Need attention now' : 'ACTION REQUIRED'}
        </div>
      </KpiTile>
    </div>
  );
}
