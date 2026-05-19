import { useCallback, useMemo, useState } from 'react';
import { useDesignData } from '@/shared/hooks/useDesignData';
import {
  loadCheckedItems,
  saveCheckedItems,
} from '@/features/inventory/utils/shoppingChecked';
import { useInventory } from '@/features/inventory';
import { createQuantity, type ItemId } from '@/shared/types';
import type { DesignStatus } from '@/shared/utils/designStatus';

export interface ShoppingListItem {
  id: string;
  rawId: ItemId;
  name: string;
  cat: string;
  need: number;
  currentQty: number;
  unit: string;
  priority: DesignStatus;
}

function critFirst(a: { priority: string }, b: { priority: string }): number {
  if (a.priority === 'crit') return -1;
  if (b.priority === 'crit') return 1;
  return 0;
}

export interface UseShoppingListResult {
  list: ShoppingListItem[];
  checked: Record<string, boolean>;
  open: number;
  done: number;
  toggle: (id: string) => void;
  addToInventory: (rawId: ItemId, currentQty: number, need: number) => void;
  reset: () => void;
}

/**
 * Shared state + actions for the v2 Shopping and MobileShopping views.
 *
 * Owns the checked-off-items map (persisted to localStorage via
 * `loadCheckedItems` / `saveCheckedItems`), exposes the derived shopping
 * list (sorted critical-first), and provides stable callbacks for toggling
 * a row, adding the missing quantity straight into inventory, and resetting
 * the entire list.
 *
 * Both Shopping screens render their own row layout but consume the same
 * underlying logic so the desktop and mobile views can never diverge on
 * what counts as "in the shopping list" or "checked off".
 */
export function useShoppingList(): UseShoppingListResult {
  const { rows } = useDesignData();
  const { updateItem } = useInventory();
  const [checked, setChecked] =
    useState<Record<string, boolean>>(loadCheckedItems);

  const list: ShoppingListItem[] = useMemo(
    () =>
      rows
        .filter((r) => r.status !== 'ok' && r.recommended > r.item.quantity)
        .map((r) => ({
          id: String(r.item.id),
          rawId: r.item.id,
          name: r.item.name,
          cat: r.categoryCode,
          need: r.recommended - r.item.quantity,
          currentQty: r.item.quantity,
          unit: r.item.unit,
          priority: r.status,
        }))
        .sort(critFirst),
    [rows],
  );

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveCheckedItems(next);
      return next;
    });
  }, []);

  const addToInventory = useCallback(
    (rawId: ItemId, currentQty: number, need: number) => {
      updateItem(rawId, { quantity: createQuantity(currentQty + need) });
      setChecked((prev) => {
        const next = { ...prev, [String(rawId)]: true };
        saveCheckedItems(next);
        return next;
      });
    },
    [updateItem],
  );

  const reset = useCallback(() => {
    setChecked({});
    saveCheckedItems({});
  }, []);

  // Single pass instead of two .filter().length walks, memoised so
  // consumers don't recount on unrelated parent state changes.
  const { open, done } = useMemo(() => {
    let openCount = 0;
    let doneCount = 0;
    for (const it of list) {
      if (checked[it.id]) doneCount++;
      else openCount++;
    }
    return { open: openCount, done: doneCount };
  }, [list, checked]);

  return { list, checked, open, done, toggle, addToInventory, reset };
}
