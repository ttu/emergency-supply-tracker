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
import styles from './OnboardQuickSetup.module.css';

export interface QuickSetupSelection {
  selectedIds: Set<string>;
  ownedIds: Set<string>;
}

interface OnboardQuickSetupProps {
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
    <div className={`${styles.row} ${selected ? styles.rowSelected : ''}`}>
      <label className={styles.checkboxLabel}>
        {/* A real checkbox carries the state and keyboard handling; the square
            below is only its picture, so the input is hidden without being
            removed from the accessibility tree. */}
        <input
          type="checkbox"
          className={`proxied-checkbox ${styles.hiddenCheckbox}`}
          checked={selected}
          data-testid={`v2-quick-setup-item-${id}`}
          onChange={onToggleSelected}
        />
        <span
          aria-hidden
          className={`checkbox-proxy ${styles.checkboxProxy} ${selected ? styles.checkboxProxySelected : ''}`}
          style={{ borderRadius: themeKey === 'pantry' ? 4 : 0 }}
        >
          {selected ? '✓' : ''}
        </span>
        <span className={styles.itemLabel}>
          {t(productKey(item.i18nKey), { ns: 'products' })}
        </span>
      </label>
      <button
        type="button"
        aria-pressed={owned}
        disabled={!selected}
        data-testid={`v2-quick-setup-owned-${id}`}
        onClick={onToggleOwned}
        className={`${styles.ownedButton} ${owned ? styles.ownedButtonActive : ''}`}
      >
        {t(
          owned
            ? `v2.onboarding.quickSetup.owned.${themeKey}`
            : `v2.onboarding.quickSetup.markOwned.${themeKey}`,
        )}
      </button>
      <span className={styles.quantity}>
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
 * this", so the list starts collapsed behind its kit name and count — 70-odd
 * rows of things already agreed to is a wall to scroll past, not a decision.
 * Opening it reveals the per-line controls: untick what doesn't apply, and
 * mark what's already in the cupboard so it starts stocked rather than at zero.
 */
export function OnboardQuickSetup({
  household,
  onAddItems,
  onSkip,
  onTryDemoData,
  onBack,
}: Readonly<OnboardQuickSetupProps>) {
  const { t } = useTranslation(['common', 'categories', 'products', 'units']);
  const { themeKey } = useDesignTheme();
  const { recommendedItems, availableKits, selectedKitId } =
    useRecommendedItems();

  const offered = useMemo(
    () => offeredItems(recommendedItems, household),
    [recommendedItems, household],
  );

  const kitName =
    availableKits.find((k) => k.id === selectedKitId)?.name ?? '—';

  const [deselected, setDeselected] = useState<Set<string>>(new Set());
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);

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

  const toggleSelected = (id: string) => {
    const isDeselecting = !deselected.has(id);
    setDeselected((d) => toggle(d, id));
    // Deselecting an item drops any "owned" mark with it, so the owned
    // count and the seeded quantities can't outlive the selection they
    // were scoped to.
    if (isDeselecting && ownedIds.has(id)) {
      setOwnedIds((o) => {
        const next = new Set(o);
        next.delete(id);
        return next;
      });
    }
  };
  const toggleOwned = (id: string) => setOwnedIds((o) => toggle(o, id));

  const allSelected = deselected.size === 0;

  const summary = (caption: string, value: number, tone?: 'ok') => (
    <Panel padding={14}>
      <Caption>{caption}</Caption>
      <div className={styles.summaryValue}>
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
      <div className={styles.summaryGrid}>
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
        <div className={styles.kitHeader}>
          <Caption>
            {t(`v2.onboarding.quickSetup.kitCaption.${themeKey}`, {
              kit: kitName,
              count: offered.length,
            })}
          </Caption>
          <div className={styles.kitHeaderActions}>
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              aria-expanded={showDetails}
              data-testid="v2-quick-setup-details"
              className={styles.headerAction}
            >
              {t(
                showDetails
                  ? `v2.onboarding.quickSetup.hideDetails.${themeKey}`
                  : `v2.onboarding.quickSetup.showDetails.${themeKey}`,
              )}
            </button>
            {/* Nothing to select or deselect while the list is closed. */}
            {showDetails && (
              <button
                type="button"
                onClick={() => {
                  if (allSelected) {
                    // Deselecting everything drops every "owned" mark with it.
                    setDeselected(new Set(offered.map((i) => String(i.id))));
                    setOwnedIds(new Set());
                  } else {
                    setDeselected(new Set());
                  }
                }}
                data-testid="v2-quick-setup-select-all"
                className={`${styles.headerAction} ${styles.headerActionMuted}`}
              >
                {t(
                  allSelected
                    ? `v2.onboarding.quickSetup.deselectAll.${themeKey}`
                    : `v2.onboarding.quickSetup.selectAll.${themeKey}`,
                )}
              </button>
            )}
          </div>
        </div>

        {showDetails &&
          groups.map((group) => (
            <div key={group.categoryId}>
              <div className={styles.categoryHeader}>
                <span className={styles.categoryLabel} style={CAPS_STYLE}>
                  {t(group.categoryId, { ns: 'categories' })}
                </span>
                <span className={styles.categoryCount}>
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

      <div className={styles.footerActions}>
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
