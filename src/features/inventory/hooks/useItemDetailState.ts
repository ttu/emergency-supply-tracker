import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import {
  useDesignData,
  type DesignItemRow,
} from '@/shared/hooks/useDesignData';
import { useInventory, useLocationSuggestions } from '@/features/inventory';
import {
  createQuantity,
  type Category,
  type InventoryItem,
} from '@/shared/types';
import { statusOf, type DesignStatus } from '@/shared/utils/designStatus';

/** Sentinel id passed in `itemId` when the detail view is opening to add a
 *  new item. Kept here (next to the hook) so both `ItemDetail` and
 *  `MobileItemDetail` re-export it without a circular dependency. */
export const NEW_ITEM_ID = '__new__';

export interface UseItemDetailStateResult {
  isNew: boolean;
  /** `undefined` when the lookup failed (the parent should render its
   *  not-found fallback). */
  row: DesignItemRow | undefined;
  /** Shortcut for `row?.item`. */
  item: InventoryItem | undefined;
  /** Shortcut for `row?.category`. */
  category: Category | undefined;
  status: DesignStatus;
  /** 0..100 — current quantity as percent of recommended, rounded. */
  pct: number;
  /** Form list of locations seen elsewhere in inventory. */
  locationSuggestions: string[];
  /** Full categories list for the embedded `ItemForm`. */
  categories: Category[];
  handleSubmit: (
    update: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  /** Prompts for confirmation; only deletes + navigates back on accept. */
  handleDelete: () => void;
  /** ±delta the quantity, clamped at zero. No-op when there is no item. */
  adjust: (delta: number) => void;
}

/**
 * Shared state + actions for the v2 ItemDetail and MobileItemDetail
 * screens.
 *
 * Both views resolve `itemId` against the same `useDesignData()` rows,
 * surface the same status/pct, and run the same submit/delete/adjust
 * actions through `useInventory`. Extracting this hook keeps the desktop
 * and mobile detail screens in lockstep — including the delete
 * confirmation prompt, which previously lived in two places.
 *
 * The hook does **not** render the not-found fallback; the caller checks
 * `row` and renders its own theme-appropriate fallback layout.
 */
export function useItemDetailState(
  itemId: string,
  onBack: () => void,
): UseItemDetailStateResult {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { rows, categories } = useDesignData();
  const { items, addItem, updateItem, deleteItem } = useInventory();
  const locationSuggestions = useLocationSuggestions(items);

  const isNew = itemId === NEW_ITEM_ID;
  const row = isNew
    ? undefined
    : rows.find((r) => String(r.item.id) === itemId);
  const item = row?.item;
  const category = row?.category;

  const status = item ? statusOf(item, row?.recommended ?? 0) : 'ok';
  const pct =
    item && row?.recommended
      ? Math.round((item.quantity / row.recommended) * 100)
      : 0;

  const handleSubmit = useCallback(
    (update: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (isNew) {
        addItem(update);
      } else if (item) {
        updateItem(item.id, update);
      }
      onBack();
    },
    [isNew, item, addItem, updateItem, onBack],
  );

  const handleDelete = useCallback(() => {
    if (!item) return;
    if (!confirm(t(`v2.itemDetail.confirmDelete.${themeKey}`))) return;
    deleteItem(item.id);
    onBack();
  }, [item, deleteItem, onBack, t, themeKey]);

  const adjust = useCallback(
    (delta: number) => {
      if (!item) return;
      const next = Math.max(0, item.quantity + delta);
      updateItem(item.id, { quantity: createQuantity(next) });
    },
    [item, updateItem],
  );

  return {
    isNew,
    row,
    item,
    category,
    status,
    pct,
    locationSuggestions,
    categories,
    handleSubmit,
    handleDelete,
    adjust,
  };
}
