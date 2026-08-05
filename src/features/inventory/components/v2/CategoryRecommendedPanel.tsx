import { useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { CAPS_STYLE, Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useCategoryStatuses } from '@/features/dashboard';
import { useInventory } from '@/features/inventory';
import { createItemId, createProductTemplateId } from '@/shared/types';
import type { CategoryShortage } from '../CategoryStatusSummary';
import { useMarkableItems } from '../../hooks/useMarkableItems';

interface CategoryRecommendedPanelProps {
  categoryId: string;
  /** Opens the item form pre-filled from that recommended product. */
  onAdd: (templateId: string) => void;
  /**
   * Phone layout: the name is allowed to wrap above the actions, and those
   * actions grow to the 44px touch target WCAG asks for. The desktop row is
   * deliberately denser than that, which a mouse can hit and a thumb cannot.
   */
  stacked?: boolean;
}

const HEADER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  width: '100%',
  padding: '12px 20px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
};

const HEADING_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--color-text-2)',
  ...CAPS_STYLE,
};

const TOGGLE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--color-accent)',
  whiteSpace: 'nowrap',
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  padding: '12px 20px',
};

const NAME_STYLE: CSSProperties = { fontSize: 13, color: 'var(--color-text)' };

const SHORT_STYLE: CSSProperties = {
  color: 'var(--color-warn)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
};

const ACTIONS_STYLE: CSSProperties = { display: 'flex', gap: 6, flexShrink: 0 };

/** Outlined square, tinted by what the action means rather than by rank. */
const actionStyle = (
  color: string,
  fontSize: number,
  stacked: boolean,
): CSSProperties => ({
  width: stacked ? 44 : 30,
  height: stacked ? 44 : 30,
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize,
  lineHeight: 1,
  padding: 0,
  flexShrink: 0,
});

/**
 * The recommended products in a category that the household is short of, each
 * with the three ways v1 let you clear it: accept what you have as enough,
 * stock more, or stop being told about it.
 *
 * Collapsed by default. The count in the header is the whole message most of
 * the time — the strip above already says the category needs attention, and a
 * list of a dozen shortages between the strip and the table would push the
 * items themselves off the screen.
 *
 * Shortages present but unstocked also appear under the table's "not stocked"
 * filter; this panel is the actionable view of the same gap, scoped to the
 * category in hand.
 */
export function CategoryRecommendedPanel({
  categoryId,
  onAdd,
  stacked = false,
}: Readonly<CategoryRecommendedPanelProps>) {
  const { t } = useTranslation(['common', 'products', 'units']);
  const { themeKey } = useDesignTheme();
  const { categoryStatuses } = useCategoryStatuses();
  const { items, updateItem, disableRecommendedItem } = useInventory();
  const findMarkableItems = useMarkableItems();
  const [expanded, setExpanded] = useState(false);

  const summary = categoryStatuses.find((c) => c.categoryId === categoryId);
  const shortages = useMemo(() => {
    const named = (s: CategoryShortage) =>
      t(s.itemName.replace(/^(products\.|custom\.)/, ''), { ns: 'products' });
    return [...(summary?.shortages ?? [])].sort((a, b) =>
      named(a).localeCompare(named(b)),
    );
  }, [summary?.shortages, t]);

  if (shortages.length === 0) return null;

  return (
    <Panel padding={0}>
      <button
        type="button"
        style={{
          ...HEADER_STYLE,
          borderBottom: expanded ? '1px solid var(--color-rule-soft)' : 'none',
        }}
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        data-testid="v2-recommended-toggle"
      >
        <span style={HEADING_STYLE}>
          {t(`v2.inventory.recommendedHeading.${themeKey}`, {
            count: shortages.length,
          })}
        </span>
        <span style={TOGGLE_STYLE}>
          {expanded
            ? t(`v2.inventory.showLess.${themeKey}`)
            : t(`v2.inventory.showMore.${themeKey}`)}
        </span>
      </button>

      {expanded &&
        shortages.map((shortage, i) => (
          <ShortageRow
            key={shortage.itemId}
            shortage={shortage}
            isLast={i === shortages.length - 1}
            stacked={stacked}
            markable={findMarkableItems(shortage.itemId, items)[0]?.id}
            onMarkEnough={(id) =>
              updateItem(createItemId(id), {
                markedAsEnough: true,
              })
            }
            onAdd={onAdd}
            onDismiss={(id) =>
              disableRecommendedItem(createProductTemplateId(id))
            }
          />
        ))}
    </Panel>
  );
}

interface ShortageRowProps {
  shortage: CategoryShortage;
  isLast: boolean;
  stacked: boolean;
  /** Inventory item this shortage can be accepted on, if any. */
  markable?: string;
  onMarkEnough: (itemId: string) => void;
  onAdd: (templateId: string) => void;
  onDismiss: (templateId: string) => void;
}

function ShortageRow({
  shortage,
  isLast,
  stacked,
  markable,
  onMarkEnough,
  onAdd,
  onDismiss,
}: Readonly<ShortageRowProps>) {
  const { t } = useTranslation(['common', 'products', 'units']);
  const { themeKey } = useDesignTheme();

  const name = t(shortage.itemName.replace(/^(products\.|custom\.)/, ''), {
    ns: 'products',
  });
  const markEnoughLabel = t(`v2.inventory.markEnough.${themeKey}`);
  const addLabel = t(`v2.inventory.addToInventory.${themeKey}`);
  const dismissLabel = t(`v2.inventory.dontRecommend.${themeKey}`);

  return (
    <div
      style={{
        ...ROW_STYLE,
        borderBottom: isLast ? 'none' : '1px solid var(--color-rule-soft)',
        flexWrap: stacked ? 'wrap' : 'nowrap',
      }}
      data-testid="v2-recommended-row"
    >
      <span style={NAME_STYLE}>
        {name}{' '}
        <span style={SHORT_STYLE}>
          –{' '}
          {t(`v2.inventory.shortBy.${themeKey}`, {
            missing: shortage.missing,
            unit: t(shortage.unit, { ns: 'units' }),
          })}
        </span>
      </span>
      <span style={ACTIONS_STYLE}>
        {markable !== undefined && (
          <button
            type="button"
            style={actionStyle('var(--color-ok)', 14, stacked)}
            title={markEnoughLabel}
            aria-label={markEnoughLabel}
            onClick={() => onMarkEnough(markable)}
          >
            ✓
          </button>
        )}
        <button
          type="button"
          style={actionStyle('var(--color-accent)', 16, stacked)}
          title={addLabel}
          aria-label={addLabel}
          onClick={() => onAdd(shortage.itemId)}
        >
          +
        </button>
        <button
          type="button"
          style={actionStyle('var(--color-crit)', 13, stacked)}
          title={dismissLabel}
          aria-label={dismissLabel}
          onClick={() => onDismiss(shortage.itemId)}
        >
          ✕
        </button>
      </span>
    </div>
  );
}
