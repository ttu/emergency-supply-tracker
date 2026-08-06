import { useTranslation } from 'react-i18next';
import { StatusBar } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import { KpiTile } from './KpiTile';

/** Below this share of the target, coverage reads as a warning rather than a gap. */
const DAYS_COVERED_WARN_RATIO = 0.6;

function readinessTone(readiness: number): 'ok' | 'warn' | 'crit' {
  if (readiness >= 80) return 'ok';
  if (readiness >= 60) return 'warn';
  return 'crit';
}

/** Days covered is judged against the household's own target, not a fixed scale. */
function daysCoveredTone(
  days: number,
  targetDays: number,
): 'ok' | 'warn' | 'crit' {
  if (targetDays <= 0) return 'crit';
  if (days >= targetDays) return 'ok';
  if (days >= targetDays * DAYS_COVERED_WARN_RATIO) return 'warn';
  return 'crit';
}

/**
 * The four-up KPI row at the top of the Dashboard:
 * Readiness / Days covered / Expiring / Critical.
 */
export function KpiRow() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const {
    coverageTotals,
    readiness,
    expiringCount,
    criticalCount,
    daysCovered,
    daysCoveredDetail,
    targetDays,
  } = useDesignData();
  const tone = readinessTone(readiness);
  // Naming the resource that runs out first is the actionable half of the
  // number, but only while there is a gap to act on.
  const limitedBy =
    daysCovered < targetDays ? daysCoveredDetail.limitedBy : undefined;

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
            ok={coverageTotals.ok}
            warn={coverageTotals.warn}
            crit={coverageTotals.crit}
            total={Math.max(coverageTotals.total, 1)}
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
            {coverageTotals.ok} {t('v2.dashboard.statusOk')}
          </span>
          <span style={{ color: 'var(--color-warn)' }}>
            {coverageTotals.warn} {t('v2.dashboard.statusWarn')}
          </span>
          <span style={{ color: 'var(--color-crit)' }}>
            {coverageTotals.crit} {t('v2.dashboard.statusCrit')}
          </span>
        </div>
      </KpiTile>

      <KpiTile
        label={t(`v2.voice.daysCovered.${themeKey}`)}
        value={daysCovered.toFixed(1)}
        tone={daysCoveredTone(daysCovered, targetDays)}
      >
        <div
          style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-2)' }}
        >
          {t(`v2.dashboard.kpiTarget.${themeKey}`, { days: targetDays })}
        </div>
        {limitedBy && (
          // Grey like every other tile's detail line: the value's own tone
          // already carries the severity, so a second colour here only breaks
          // the rhythm of the row.
          <div
            style={{ marginTop: 4, fontSize: 11, color: 'var(--color-text-2)' }}
          >
            {t(`v2.dashboard.kpiLimitedBy.${themeKey}`, {
              resource: t(`v2.dashboard.limit.${limitedBy}.${themeKey}`),
            })}
          </div>
        )}
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
