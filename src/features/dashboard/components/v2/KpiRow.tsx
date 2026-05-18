import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
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
      <KpiTile
        label={t(`v2.voice.readiness.${themeKey}`)}
        value={readiness}
        suffix="%"
        tone={tone}
      >
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
          <span style={{ color: 'var(--color-ok)' }}>
            {totals.ok} {t('v2.dashboard.statusOk')}
          </span>
          <span style={{ color: 'var(--color-warn)' }}>
            {totals.warn} {t('v2.dashboard.statusWarn')}
          </span>
          <span style={{ color: 'var(--color-crit)' }}>
            {totals.crit} {t('v2.dashboard.statusCrit')}
          </span>
        </div>
      </KpiTile>

      <KpiTile
        label={t(`v2.voice.daysCovered.${themeKey}`)}
        value={daysCovered.toFixed(1)}
      >
        <div
          style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-2)' }}
        >
          {t(`v2.dashboard.kpiTarget.${themeKey}`)}
        </div>
      </KpiTile>

      <KpiTile
        label={t(`v2.voice.expiringSoon.${themeKey}`)}
        value={expiringCount}
        tone={expiringCount > 0 ? 'warn' : undefined}
      >
        <div
          style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-2)' }}
        >
          {t(`v2.dashboard.kpiNext30.${themeKey}`)}
        </div>
      </KpiTile>

      <KpiTile
        label={t(`v2.voice.critical.${themeKey}`)}
        value={criticalCount}
        tone={criticalCount > 0 ? 'crit' : 'ok'}
      >
        <div
          style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-2)' }}
        >
          {t(`v2.dashboard.kpiActionRequired.${themeKey}`)}
        </div>
      </KpiTile>
    </div>
  );
}
