import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Caption,
  Panel,
  StatusBar,
  StatusPill,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useCategoryStatuses } from '@/features/dashboard';
import { toDesignStatus } from '@/shared/utils/designStatus';
import { isFoodCategory } from '@/shared/types';

/** The water category drives the drinking/preparation split. */
const WATER_CATEGORY_ID = 'water-beverages';

interface CategorySummaryPanelProps {
  categoryId: string;
  categoryName: string;
}

const HEADER_STYLE: CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid var(--color-rule-soft)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
};

const BODY_STYLE: CSSProperties = { padding: '16px 20px' };

const TOTAL_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 20,
  fontWeight: 600,
  color: 'var(--color-text)',
  fontFeatureSettings: '"tnum"',
};

const BREAKDOWN_STYLE: CSSProperties = {
  marginTop: 14,
  paddingTop: 14,
  borderTop: '1px solid var(--color-rule-soft)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--color-text-2)',
};

const ROW_VALUE_STYLE: CSSProperties = { color: 'var(--color-text)' };

const SHORTAGE_STYLE: CSSProperties = {
  ...ROW_STYLE,
  color: 'var(--color-warn)',
};

/**
 * What the selected category actually requires, and how far off it is.
 *
 * v2's coverage matrix reports ok/total counts, which says nothing about *how
 * much* is missing — v1's category summary showed the derivation ("water for
 * people: 60 L, total required: 80 L") and the per-item shortfall. This is
 * that panel in v2 dress; category enable/disable stays in Settings §8 rather
 * than being duplicated here.
 */
export function CategorySummaryPanel({
  categoryId,
  categoryName,
}: Readonly<CategorySummaryPanelProps>) {
  const { t } = useTranslation(['common', 'products', 'units']);
  const { themeKey } = useDesignTheme();
  const { categoryStatuses } = useCategoryStatuses();

  const summary = categoryStatuses.find((c) => c.categoryId === categoryId);
  if (!summary?.hasRecommendations) return null;

  const isFood = isFoodCategory(categoryId);
  const isWater = categoryId === WATER_CATEGORY_ID;
  const unit = summary.primaryUnit ?? '';

  const actual = isFood
    ? Math.round(summary.totalActualCalories ?? 0)
    : summary.totalActual;
  const needed = isFood
    ? Math.round(summary.totalNeededCalories ?? 0)
    : summary.totalNeeded;
  const translatedUnit = unit ? t(unit, { ns: 'units' }) : '';
  const unitLabel = isFood ? 'kcal' : translatedUnit;

  return (
    <Panel padding={0}>
      <div style={HEADER_STYLE}>
        <Caption>{categoryName}</Caption>
        <StatusPill status={toDesignStatus(summary.status)} />
      </div>
      <div style={BODY_STYLE}>
        <div style={TOTAL_STYLE}>
          {actual} / {needed} {unitLabel}
        </div>
        <div style={{ marginTop: 10 }}>
          <StatusBar
            ok={summary.okCount}
            warn={summary.warningCount}
            crit={summary.criticalCount}
            total={Math.max(summary.itemCount, 1)}
            height={5}
          />
        </div>

        {(isWater || summary.shortages.length > 0) && (
          <div style={BREAKDOWN_STYLE}>
            {isWater && !!summary.drinkingWaterNeeded && (
              <div style={ROW_STYLE}>
                <span>{t(`v2.inventory.waterDrinking.${themeKey}`)}</span>
                <span style={ROW_VALUE_STYLE}>
                  {Math.round(summary.drinkingWaterNeeded)} {unitLabel}
                </span>
              </div>
            )}
            {isWater && !!summary.preparationWaterNeeded && (
              <div style={ROW_STYLE}>
                <span>{t(`v2.inventory.waterPreparation.${themeKey}`)}</span>
                <span style={ROW_VALUE_STYLE}>
                  {Math.round(summary.preparationWaterNeeded)} {unitLabel}
                </span>
              </div>
            )}
            {summary.shortages.slice(0, 5).map((s) => (
              <div key={s.itemId} style={SHORTAGE_STYLE}>
                <span>
                  {t(s.itemName.replace('products.', ''), {
                    ns: 'products',
                  })}
                </span>
                <span>
                  {t(`v2.inventory.shortBy.${themeKey}`, {
                    missing: s.missing,
                    unit: t(s.unit, { ns: 'units' }),
                  })}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...ROW_STYLE, marginTop: 12 }}>
          <span>{t(`v2.inventory.totalRequired.${themeKey}`)}</span>
          <span style={ROW_VALUE_STYLE}>
            {needed} {unitLabel}
          </span>
        </div>
      </div>
    </Panel>
  );
}
