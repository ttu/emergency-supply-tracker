import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Caption,
  CAPS_STYLE,
  NumberDisplay,
  Panel,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useRecommendedItems } from '@/features/templates';
import { calculateRecommendedQuantity } from '@/shared/utils/calculations/recommendedQuantity';
import type {
  HouseholdConfig,
  RecommendedItemDefinition,
} from '@/shared/types';
import { OnboardLayout } from './OnboardLayout';
import { offeredItems } from './buildOnboardingItems';

export interface QuickSetupSelection {
  selectedIds: Set<string>;
  ownedIds: Set<string>;
}

interface OnboardStep06QuickSetupProps {
  household: HouseholdConfig;
  onAddItems: (selection: QuickSetupSelection) => void;
  onSkip: () => void;
  onTryDemoData: () => void;
  onBack: () => void;
}

const productKey = (i18nKey: string) =>
  i18nKey.replace(/^(products\.|custom\.)/, '');

/** Add `id` if absent, remove it if present. */
const toggle = (set: Set<string>, id: string) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

interface QuickSetupRowProps {
  item: RecommendedItemDefinition;
  household: HouseholdConfig;
  selected: boolean;
  owned: boolean;
  onToggleSelected: () => void;
  onToggleOwned: () => void;
}

/** One product on the checklist: tick to track, mark if already held. */
function QuickSetupRow({
  item,
  household,
  selected,
  owned,
  onToggleSelected,
  onToggleOwned,
}: Readonly<QuickSetupRowProps>) {
  const { t } = useTranslation(['common', 'products', 'units']);
  const { themeKey } = useDesignTheme();
  const id = String(item.id);

  return (
    <div
      style={{
        padding: '11px 18px',
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: 14,
        alignItems: 'center',
        borderBottom: '1px solid var(--color-rule-soft)',
        opacity: selected ? 1 : 0.5,
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        data-testid={`v2-quick-setup-item-${id}`}
        onClick={onToggleSelected}
        style={{
          display: 'grid',
          gridTemplateColumns: '20px 1fr',
          gap: 14,
          alignItems: 'center',
          background: 'transparent',
          border: 0,
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          color: 'inherit',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 18,
            height: 18,
            border: `1.5px solid ${selected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
            background: selected ? 'var(--color-accent)' : 'transparent',
            borderRadius: themeKey === 'pantry' ? 4 : 0,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--color-accent-ink)',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {selected ? '✓' : ''}
        </span>
        <span
          style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}
        >
          {t(productKey(item.i18nKey), { ns: 'products' })}
        </span>
      </button>
      <button
        type="button"
        aria-pressed={owned}
        disabled={!selected}
        data-testid={`v2-quick-setup-owned-${id}`}
        onClick={onToggleOwned}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.06em',
          padding: '3px 8px',
          borderRadius: 'var(--radius-pill)',
          whiteSpace: 'nowrap',
          background: owned ? 'transparent' : 'var(--color-panel)',
          border: `1px solid ${owned ? 'var(--color-ok)' : 'var(--color-rule)'}`,
          color: owned ? 'var(--color-ok)' : 'var(--color-text-3)',
          cursor: selected ? 'pointer' : 'not-allowed',
        }}
      >
        {t(
          owned
            ? `v2.onboarding.quickSetup.owned.${themeKey}`
            : `v2.onboarding.quickSetup.markOwned.${themeKey}`,
        )}
      </button>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--color-accent)',
          textAlign: 'right',
          fontFeatureSettings: '"tnum"',
          minWidth: 84,
        }}
      >
        {calculateRecommendedQuantity(item, household)}{' '}
        {t(item.unit, { ns: 'units' })}
      </span>
    </div>
  );
}

/**
 * Step 6 — the starting checklist, drawn from the chosen kit and sized to the
 * household.
 *
 * Everything is ticked to begin with: the common case is "yes, track all of
 * this". Untick what doesn't apply, and mark what's already in the cupboard so
 * it starts stocked rather than at zero.
 */
export function OnboardStep06QuickSetup({
  household,
  onAddItems,
  onSkip,
  onTryDemoData,
  onBack,
}: Readonly<OnboardStep06QuickSetupProps>) {
  const { t } = useTranslation(['common', 'categories', 'products', 'units']);
  const { themeKey } = useDesignTheme();
  const { recommendedItems } = useRecommendedItems();

  const offered = useMemo(
    () => offeredItems(recommendedItems, household),
    [recommendedItems, household],
  );

  const [deselected, setDeselected] = useState<Set<string>>(new Set());
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(true);

  /**
   * Selection is tracked as the *exclusions*, so products arriving later (a
   * kit swap, a household change) are included by default rather than
   * silently dropped.
   */
  const selectedIds = useMemo(
    () =>
      new Set(
        offered.map((i) => String(i.id)).filter((id) => !deselected.has(id)),
      ),
    [offered, deselected],
  );

  const groups = useMemo(() => {
    const byCategory = new Map<string, RecommendedItemDefinition[]>();
    for (const item of offered) {
      const key = String(item.category);
      const list = byCategory.get(key);
      if (list) list.push(item);
      else byCategory.set(key, [item]);
    }
    return [...byCategory.entries()].map(([categoryId, items]) => ({
      categoryId,
      items: [...items].sort((a, b) =>
        t(productKey(a.i18nKey), { ns: 'products' }).localeCompare(
          t(productKey(b.i18nKey), { ns: 'products' }),
        ),
      ),
    }));
  }, [offered, t]);

  const toggleSelected = (id: string) => setDeselected((d) => toggle(d, id));
  const toggleOwned = (id: string) => setOwnedIds((o) => toggle(o, id));

  const allSelected = deselected.size === 0;

  const summary = (caption: string, value: number, tone?: 'ok') => (
    <Panel padding={14}>
      <Caption>{caption}</Caption>
      <div style={{ marginTop: 6 }}>
        <NumberDisplay value={value} size={28} tone={tone} />
      </div>
    </Panel>
  );

  return (
    <OnboardLayout
      step={6}
      title={t(`v2.voice.onbQuickSetup.${themeKey}`)}
      lead={{
        title: t(`v2.onboarding.quickSetup.leadTitle.${themeKey}`),
        sub: t(`v2.onboarding.quickSetup.leadSub.${themeKey}`),
      }}
      back={onBack}
      onContinue={() => onAddItems({ selectedIds, ownedIds })}
      primaryLabel={t(
        allSelected
          ? `v2.onboarding.quickSetup.addAll.${themeKey}`
          : `v2.onboarding.quickSetup.addSelected.${themeKey}`,
      )}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {summary(
          t(`v2.onboarding.quickSetup.selectedCaption.${themeKey}`),
          selectedIds.size,
        )}
        {summary(
          t(`v2.onboarding.quickSetup.ownedCaption.${themeKey}`),
          ownedIds.size,
          'ok',
        )}
        {summary(
          t(`v2.onboarding.quickSetup.daysCaption.${themeKey}`),
          household.supplyDurationDays,
        )}
      </div>

      <Panel padding={0}>
        <div
          style={{
            padding: '11px 18px',
            borderBottom: '1px solid var(--color-rule-soft)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Caption>
            {t(`v2.onboarding.quickSetup.itemsCaption.${themeKey}`, {
              count: offered.length,
            })}
          </Caption>
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              aria-expanded={showDetails}
              data-testid="v2-quick-setup-details"
              style={{
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.06em',
                color: 'var(--color-text-2)',
              }}
            >
              {t(
                showDetails
                  ? `v2.onboarding.quickSetup.hideDetails.${themeKey}`
                  : `v2.onboarding.quickSetup.showDetails.${themeKey}`,
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                setDeselected(
                  allSelected
                    ? new Set(offered.map((i) => String(i.id)))
                    : new Set(),
                )
              }
              data-testid="v2-quick-setup-select-all"
              style={{
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.06em',
                color: 'var(--color-accent)',
              }}
            >
              {t(
                allSelected
                  ? `v2.onboarding.quickSetup.deselectAll.${themeKey}`
                  : `v2.onboarding.quickSetup.selectAll.${themeKey}`,
              )}
            </button>
          </div>
        </div>

        {showDetails &&
          groups.map((group) => (
            <div key={group.categoryId}>
              <div
                style={{
                  padding: '10px 18px',
                  background: 'var(--color-panel-2)',
                  borderBottom: '1px solid var(--color-rule-soft)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    ...CAPS_STYLE,
                    color: 'var(--color-text)',
                  }}
                >
                  {t(group.categoryId, { ns: 'categories' })}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-3)',
                  }}
                >
                  {group.items.length}
                </span>
              </div>
              {group.items.map((item) => (
                <QuickSetupRow
                  key={String(item.id)}
                  item={item}
                  household={household}
                  selected={selectedIds.has(String(item.id))}
                  owned={ownedIds.has(String(item.id))}
                  onToggleSelected={() => toggleSelected(String(item.id))}
                  onToggleOwned={() => toggleOwned(String(item.id))}
                />
              ))}
            </div>
          ))}
      </Panel>

      <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={onSkip}>
          {t(`v2.onboarding.quickSetup.skip.${themeKey}`)}
        </Button>
        <Button variant="secondary" onClick={onTryDemoData}>
          {t(`v2.onboarding.quickSetup.tryDemo.${themeKey}`)}
        </Button>
      </div>
    </OnboardLayout>
  );
}
