import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/components';
import { ItemForm, useInventory } from '@/features/inventory';
import type { InventoryItem } from '@/shared/types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
}

/**
 * Lightweight wrapper that mounts the v1 ItemForm in a Modal so the
 * design v2 Inventory "+ ADD" button can open the existing add-item
 * flow with the currently filtered category preselected.
 */
export function AddItemModal({
  isOpen,
  onClose,
  defaultCategoryId,
}: AddItemModalProps) {
  const { t } = useTranslation();
  const { categories, addItem } = useInventory();

  const handleSubmit = (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    addItem(item);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('inventory.addItem')}
      size="large"
    >
      <div className="design-v2-embed">
        <ItemForm
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={onClose}
          defaultCategoryId={defaultCategoryId}
        />
      </div>
    </Modal>
  );
}
