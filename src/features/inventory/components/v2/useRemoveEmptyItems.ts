import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useInventory } from '@/features/inventory';

export interface UseRemoveEmptyItemsResult {
  /** 0-quantity items in scope (respecting `categoryId`). */
  count: number;
  buttonLabel: string;
  confirmOpen: boolean;
  confirmTitle: string;
  confirmMessage: string;
  confirmLabel: string;
  /** Opens the confirmation dialog. No-op when `count` is 0. */
  handleOpen: () => void;
  /** Deletes the in-scope 0-quantity items and closes the dialog. */
  handleConfirm: () => void;
  handleCancel: () => void;
}

/**
 * Bulk-deletes every item with 0 quantity, optionally scoped to one
 * category. Mirrors v1's "remove empty items" action
 * (`features/inventory/pages/Inventory.tsx`), but confirms through the
 * themed `ConfirmDialog` instead of `window.confirm`.
 */
export function useRemoveEmptyItems(
  categoryId?: string,
): UseRemoveEmptyItemsResult {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { items, deleteItems } = useInventory();
  const [open, setOpen] = useState(false);

  const zeroQuantityItems = useMemo(() => {
    let result = items.filter((item) => item.quantity === 0);
    if (categoryId) {
      result = result.filter((item) => String(item.categoryId) === categoryId);
    }
    return result;
  }, [items, categoryId]);

  const handleOpen = useCallback(() => {
    if (zeroQuantityItems.length === 0) return;
    setOpen(true);
  }, [zeroQuantityItems.length]);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    deleteItems(zeroQuantityItems.map((item) => item.id));
  }, [zeroQuantityItems, deleteItems]);

  const handleCancel = useCallback(() => setOpen(false), []);

  return {
    count: zeroQuantityItems.length,
    buttonLabel: t(`v2.inventory.removeEmptyItems.${themeKey}`),
    confirmOpen: open,
    confirmTitle: t(`v2.inventory.confirmRemoveEmpty.${themeKey}`, {
      count: zeroQuantityItems.length,
    }),
    confirmMessage: t(`v2.inventory.confirmRemoveEmptyBody.${themeKey}`),
    confirmLabel: t(`v2.voice.delete.${themeKey}`),
    handleOpen,
    handleConfirm,
    handleCancel,
  };
}
