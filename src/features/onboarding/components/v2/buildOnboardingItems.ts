import { InventoryItemFactory } from '@/features/inventory/factories/InventoryItemFactory';
import { calculateRecommendedQuantity } from '@/shared/utils/calculations/recommendedQuantity';
import { createQuantity } from '@/shared/types';
import type {
  HouseholdConfig,
  InventoryItem,
  RecommendedItemDefinition,
} from '@/shared/types';

/** Translator shape needed to name the seeded items. */
type NameResolver = (i18nKey: string) => string;

export interface OnboardingSelection {
  /** Products the household chose to track. */
  selectedIds: ReadonlySet<string>;
  /** Of those, the ones it already has — seeded at the recommended amount. */
  ownedIds: ReadonlySet<string>;
}

/**
 * The inventory a v2 household starts with, from what it ticked in quick setup.
 *
 * Selected products arrive at quantity 0 — they are on the list to acquire,
 * not claimed to be in the cupboard. Products marked "owned" arrive at their
 * recommended quantity instead, so the dashboard shows them as covered
 * straight away.
 *
 * The caller is responsible for offering only products that apply to this
 * household (no frozen goods without a freezer, no pet supplies without pets);
 * this builds from whatever it was given.
 */
export function buildOnboardingItems(
  recommendedItems: RecommendedItemDefinition[],
  household: HouseholdConfig,
  { selectedIds, ownedIds }: OnboardingSelection,
  resolveName: NameResolver,
): InventoryItem[] {
  return recommendedItems
    .filter((item) => selectedIds.has(String(item.id)))
    .map((item) =>
      InventoryItemFactory.createFromTemplate(item, household, {
        name: resolveName(item.i18nKey),
        quantity: createQuantity(
          ownedIds.has(String(item.id))
            ? calculateRecommendedQuantity(item, household)
            : 0,
        ),
      }),
    );
}

/**
 * The products worth offering a household: everything the kit recommends,
 * minus what its circumstances rule out.
 */
export function offeredItems(
  recommendedItems: RecommendedItemDefinition[],
  household: HouseholdConfig,
): RecommendedItemDefinition[] {
  return recommendedItems.filter((item) => {
    if (item.requiresFreezer && !household.useFreezer) return false;
    if (item.scaleWithPets && household.pets === 0) return false;
    return true;
  });
}
