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
import type { CategoryId } from '@/shared/types';

interface CoverageMatrixProps {
  onCategorySelect: (categoryId: string) => void;
}

/** 5-col grid of category tiles showing OK/WARN/CRIT distribution per category. */
export function CoverageMatrix({ onCategorySelect }: CoverageMatrixProps) {
  const { i18n } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { stats, categories } = useDesignData();
  const lang = i18n.language || 'en';

  const categoryName = (id: CategoryId, fallback: string) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.names?.[lang] ?? cat?.name ?? fallback;
  };

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
              data-testid={`v2-category-${String(s.category.id)}`}
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
  );
}
