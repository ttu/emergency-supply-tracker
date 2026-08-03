import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CAPS_STYLE,
  Panel,
  StatusPill,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { DesignStatus } from '@/shared/utils/designStatus';
import type { CategoryCoverage } from './useCategoryCoverage';

interface CategoryStatusStripProps extends CategoryCoverage {
  /** Category name, or the "all categories" wording when nothing is picked. */
  label: string;
  /**
   * Phones get the same three facts stacked instead of laid across, since a
   * 260px name column plus a bar plus a count does not fit on 375px.
   */
  stacked?: boolean;
}

const STATUS_COLOR: Record<DesignStatus, string> = {
  ok: 'var(--color-ok)',
  warn: 'var(--color-warn)',
  crit: 'var(--color-crit)',
};

/**
 * The fixed height is the point: the strip sits above the inventory table and
 * is always mounted, so switching category must not shove the table up or
 * down. Every cell inside is sized to fit its worst case.
 */
const ROW_BODY_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '260px minmax(0, 1fr) 150px',
  alignItems: 'center',
  gap: 24,
  padding: '16px 20px',
  height: 76,
  boxSizing: 'border-box',
};

const STACKED_BODY_STYLE: CSSProperties = { padding: '14px 16px' };

const LABEL_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-3)',
  ...CAPS_STYLE,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const COVERAGE_LABEL_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  color: 'var(--color-text-2)',
};

const COVERAGE_VALUE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text)',
  fontFeatureSettings: '"tnum"',
};

const TRACK_STYLE: CSSProperties = {
  height: 4,
  background: 'var(--color-rule)',
  borderRadius: 2,
  overflow: 'hidden',
};

/**
 * Category status at a glance: how covered it is, whether it needs attention,
 * and how many of its items are below target. It answers "is this category in
 * trouble?" before the table answers "which item is".
 *
 * The detailed derivation — litres or calories, the water split, per-item
 * shortfalls — stays in [CategorySummaryPanel], which renders below this.
 * Both read the same figures via {@link useCategoryCoverage}, so the strip's
 * percentage never contradicts the panel it sits on top of.
 */
export function CategoryStatusStrip({
  label,
  status,
  coverage,
  shortCount,
  stacked = false,
}: Readonly<CategoryStatusStripProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();

  const bar = (
    <div style={TRACK_STYLE}>
      <div
        style={{
          width: `${coverage}%`,
          height: '100%',
          background: STATUS_COLOR[status],
        }}
      />
    </div>
  );
  const coverageLabel = t(`v2.inventory.coverage.${themeKey}`);
  const shortLabel = t(`v2.inventory.itemsShort.${themeKey}`, {
    count: shortCount,
  });

  if (stacked) {
    return (
      <Panel padding={0}>
        <div style={STACKED_BODY_STYLE} data-testid="v2-category-status-strip">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={LABEL_STYLE}>{label}</span>
            <StatusPill status={status} />
          </div>
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
            }}
          >
            <span style={COVERAGE_LABEL_STYLE}>{coverageLabel}</span>
            <span style={COVERAGE_VALUE_STYLE}>
              <span data-testid="v2-category-strip-coverage">{coverage}%</span>
              {' · '}
              <span data-testid="v2-category-strip-short">
                {shortCount}
              </span>{' '}
              {shortLabel}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>{bar}</div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel padding={0}>
      <div style={ROW_BODY_STYLE} data-testid="v2-category-status-strip">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            minWidth: 0,
          }}
        >
          <span style={LABEL_STYLE}>{label}</span>
          <span style={{ alignSelf: 'flex-start' }}>
            <StatusPill status={status} />
          </span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <span style={COVERAGE_LABEL_STYLE}>{coverageLabel}</span>
            <span
              style={COVERAGE_VALUE_STYLE}
              data-testid="v2-category-strip-coverage"
            >
              {coverage}%
            </span>
          </div>
          {bar}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            data-testid="v2-category-strip-short"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1,
              fontFeatureSettings: '"tnum"',
              color: shortCount ? 'var(--color-warn)' : 'var(--color-ok)',
            }}
          >
            {shortCount}
          </div>
          <div style={{ ...LABEL_STYLE, marginTop: 5, whiteSpace: 'normal' }}>
            {shortLabel}
          </div>
        </div>
      </div>
    </Panel>
  );
}
