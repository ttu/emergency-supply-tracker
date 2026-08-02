import { InventoryItemFactory } from '@/features/inventory/factories/InventoryItemFactory';
import { createQuantity } from '@/shared/types';
import type {
  HouseholdConfig,
  InventoryItem,
  RecommendedItemDefinition,
} from '@/shared/types';

/** Translator shape needed to name the seeded items. */
type NameResolver = (i18nKey: string) => string;

/**
 * The inventory a v2 household starts with, derived from the categories it
 * picked during onboarding.
 *
 * v1's quick-setup step seeds real items from the recommendation set so a new
 * household lands on a stocked checklist rather than an empty page; v2 chose
 * categories but then completed with nothing. This restores that, keeping v1's
 * conventions:
 *
 * - Items are created at quantity 0 — they are on the list to acquire, not
 *   claimed to be in the cupboard. (v1 uses 0 when everything is selected,
 *   which is what picking a whole category means here.)
 * - Frozen items are skipped without a freezer, and pet supplies without pets,
 *   matching the filtering v1 applies before seeding.
 */
export function buildOnboardingItems(
  recommendedItems: RecommendedItemDefinition[],
  household: HouseholdConfig,
  enabledCategories: Set<string>,
  resolveName: NameResolver,
): InventoryItem[] {
  return recommendedItems
    .filter((item) => {
      if (!enabledCategories.has(String(item.category))) return false;
      if (item.requiresFreezer && !household.useFreezer) return false;
      if (item.scaleWithPets && household.pets === 0) return false;
      return true;
    })
    .map((item) =>
      InventoryItemFactory.createFromTemplate(item, household, {
        name: resolveName(item.i18nKey),
        quantity: createQuantity(0),
      }),
    );
}
