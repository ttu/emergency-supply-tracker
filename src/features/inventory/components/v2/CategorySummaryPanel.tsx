import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useCategoryStatuses } from '@/features/dashboard';
import { isFoodCategory } from '@/shared/types';
import { WATER_CATEGORY_ID } from '@/shared/utils/constants';

interface CategorySummaryPanelProps {
  categoryId: string;
}

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

/**
 * What the selected category actually requires, and how far off it is.
 *
 * v2's coverage matrix reports ok/total counts, which says nothing about *how
 * much* is missing — v1's category summary showed the derivation ("water for
 * people: 60 L, total required: 80 L"). This is that derivation in v2 dress;
 * category enable/disable stays in Settings §8 rather than being duplicated
 * here.
 *
 * It sits between [CategoryStatusStrip], which already names the category and
 * shows its status pill — so this panel is body only — and
 * [CategoryRecommendedPanel], which owns the per-item shortfalls and the
 * actions that clear them.
 */
export function CategorySummaryPanel({
  categoryId,
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
      <div style={BODY_STYLE}>
        {/* No bar here: the strip above already draws coverage, and a second
            bar this close — one measuring litres, one counting item statuses —
            reads as a contradiction rather than as two facts. The item split
            stays one line further down, in the filter tabs' counts. */}
        <div style={TOTAL_STYLE}>
          {actual} / {needed} {unitLabel}
        </div>

        {/* Per-item shortfalls live in [CategoryRecommendedPanel] directly
            below, where each one comes with the actions that clear it —
            listing them here too would state the same gap twice, once
            actionable and once not. */}
        {isWater && (
          <div style={BREAKDOWN_STYLE}>
            {!!summary.drinkingWaterNeeded && (
              <div style={ROW_STYLE}>
                <span>{t(`v2.inventory.waterDrinking.${themeKey}`)}</span>
                <span style={ROW_VALUE_STYLE}>
                  {Math.round(summary.drinkingWaterNeeded)} {unitLabel}
                </span>
              </div>
            )}
            {!!summary.preparationWaterNeeded && (
              <div style={ROW_STYLE}>
                <span>{t(`v2.inventory.waterPreparation.${themeKey}`)}</span>
                <span style={ROW_VALUE_STYLE}>
                  {Math.round(summary.preparationWaterNeeded)} {unitLabel}
                </span>
              </div>
            )}
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
