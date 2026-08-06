import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Caption,
  Panel,
  StatusBar,
  StatusDot,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import { categoryCode } from '@/shared/i18n/voice';
import { resolveCategoryLabel } from '@/shared/i18n/categoryLabel';
import type { CategoryId } from '@/shared/types';

interface CoverageMatrixProps {
  onCategorySelect: (categoryId: string) => void;
}

/** 5-col grid of category tiles showing coverage against recommendations. */

export function CoverageMatrix({
  onCategorySelect,
}: Readonly<CoverageMatrixProps>) {
  const { t, i18n } = useTranslation(['common', 'categories']);
  const { themeKey } = useDesignTheme();
  const { stats, categories } = useDesignData();
  const lang = i18n.language || 'en';

  const categoryName = (id: CategoryId) =>
    resolveCategoryLabel(
      categories.find((c) => c.id === id),
      String(id),
      lang,
      t,
    );

  // The "covered" half of the ratio: categories with nothing outstanding
  // against their recommendations. An empty category is not covered — it has
  // no crit or warn items precisely because it holds no items at all. This
  // previously rendered stats.length on both sides, so it always read
  // "N / N" whatever the inventory looked like.
  const fullyCovered = stats.filter((s) => s.coverage === 'ok').length;

  return (
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
        <Caption>{t(`v2.dashboard.coverageTitle.${themeKey}`)}</Caption>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-3)',
          }}
        >
          {fullyCovered} / {stats.length}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {stats.map((s, i) => {
          const tone = s.coverage;
          const isLastInRow = (i + 1) % 5 === 0;
          const isInLastRow = i >= Math.floor((stats.length - 1) / 5) * 5;
          const cellStyle: CSSProperties = {
            padding: '16px 18px',
            borderRight: isLastInRow
              ? 'none'
              : '1px solid var(--color-rule-soft)',
            borderBottom: isInLastRow
              ? 'none'
              : '1px solid var(--color-rule-soft)',
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
              data-testid={`v2-category-${String(s.category.id)}`}
              data-status={tone}
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
                {categoryName(s.category.id)}
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
  );
}
