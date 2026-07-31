import { useMemo } from 'react';
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { calculateRecommendedQuantity } from '@/shared/utils/calculations/recommendedQuantity';
import { itemMatchesRecommendedId } from '@/shared/utils/calculations/itemMatching';
import { categoryCode } from '@/shared/i18n/voice';
import type { RecommendedItemDefinition } from '@/shared/types';

/** A recommended product the household has nothing matching for. */
export interface MissingRecommendedItem {
  definition: RecommendedItemDefinition;
  /** Target quantity once scaled to this household. Always > 0. */
  recommended: number;
  categoryId: string;
  /** Three-letter code used by the v2 surfaces (H2O, FUD, …). */
  categoryCode: string;
}

/**
 * The recommended products this household should stock but owns nothing of.
 *
 * v2's {@link useDesignData} only knows about items that already exist, which
 * left the 81-item baseline undiscoverable — a freshly onboarded household saw
 * an empty inventory and no route to the recommendations. This hook is the
 * other half: what is *absent*.
 *
 * Excluded: products the user disabled, and products that scale to zero for
 * this household (pet supplies with no pets, freezer items with no freezer).
 *
 * Results are grouped by category so views can render section headers without
 * sorting again.
 */
export function useMissingRecommendedItems(): MissingRecommendedItem[] {
  const { items, disabledRecommendedItems } = useInventory();
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();

  return useMemo(() => {
    const disabled = new Set(disabledRecommendedItems.map(String));

    const missing: MissingRecommendedItem[] = [];
    for (const definition of recommendedItems) {
      const id = String(definition.id);
      if (disabled.has(id)) continue;

      const owned = items.some((item) => itemMatchesRecommendedId(item, id));
      if (owned) continue;

      const recommended = calculateRecommendedQuantity(definition, household);
      if (recommended <= 0) continue;

      const categoryId = String(definition.category);
      missing.push({
        definition,
        recommended,
        categoryId,
        categoryCode: categoryCode(categoryId),
      });
    }

    // Group by category, preserving the order categories first appear in the
    // recommendation set (which is the curated 72tuntia.fi ordering).
    const categoryOrder = new Map<string, number>();
    for (const m of missing) {
      if (!categoryOrder.has(m.categoryId)) {
        categoryOrder.set(m.categoryId, categoryOrder.size);
      }
    }
    return missing.sort(
      (a, b) =>
        (categoryOrder.get(a.categoryId) ?? 0) -
        (categoryOrder.get(b.categoryId) ?? 0),
    );
  }, [items, disabledRecommendedItems, household, recommendedItems]);
}
