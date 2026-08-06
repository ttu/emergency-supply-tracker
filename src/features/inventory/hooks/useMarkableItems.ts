import { useCallback } from 'react';
import type { InventoryItem } from '@/shared/types';
import { getRecommendedQuantityForItem } from '@/shared/utils/calculations/itemRecommendedQuantity';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { useSettings } from '@/features/settings';
import { CHILDREN_REQUIREMENT_MULTIPLIER } from '@/shared/utils/constants';

/**
 * Finds the inventory items a recommendation shortage could be satisfied by
 * declaring "I have enough of this".
 */
export type FindMarkableItems = (
  shortageItemId: string,
  items: InventoryItem[],
) => InventoryItem[];

/**
 * Which inventory items a shortage can be marked as enough on.
 *
 * A shortage names a recommended product, not an inventory row, so the row it
 * refers to has to be found first — by product template id, or by name for
 * items added before templates existed. Custom items are matched by template
 * id only: a user's own "bottled water" is not the recommendation, and
 * marking it would silence a target it never met.
 *
 * Only an item that is genuinely short qualifies. Marking is the user saying
 * "the recommendation is wrong for me", which has no meaning for an item that
 * already meets its target, one that holds nothing at all, or one that has
 * been marked before.
 *
 * Shared by v1's [CategoryStatusSummary] and v2's [CategoryRecommendedPanel]
 * so the two surfaces cannot disagree about which items offer the action.
 */
export function useMarkableItems(): FindMarkableItems {
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();
  const { settings } = useSettings();

  const childrenMultiplier = settings.childrenRequirementPercentage
    ? settings.childrenRequirementPercentage / 100
    : CHILDREN_REQUIREMENT_MULTIPLIER;

  return useCallback(
    (shortageItemId, items) => {
      const wanted = shortageItemId.toLowerCase();

      return items.filter((item) => {
        const isCustomItem = item.itemType === 'custom';
        const matchesTemplate = item.itemType?.toLowerCase() === wanted;
        const matchesName =
          !isCustomItem &&
          item.name.toLowerCase().replaceAll(' ', '-') === wanted;

        if (!matchesTemplate && !matchesName) return false;

        const recommendedQuantity = getRecommendedQuantityForItem(
          item,
          household,
          recommendedItems,
          childrenMultiplier,
        );

        return (
          !item.markedAsEnough &&
          item.quantity > 0 &&
          recommendedQuantity > 0 &&
          item.quantity < recommendedQuantity
        );
      });
    },
    [household, recommendedItems, childrenMultiplier],
  );
}
