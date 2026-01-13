import { useTranslation } from 'react-i18next';
import { ItemCard } from './ItemCard';
import type { InventoryItem } from '@/shared/types';
import styles from './ItemList.module.css';

export interface ItemListProps {
  items: InventoryItem[];
  onItemClick?: (item: InventoryItem) => void;
  emptyMessage?: string;
}

export const ItemList = ({
  items,
  onItemClick,
  emptyMessage,
}: ItemListProps) => {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📦</div>
        <p className={styles.emptyMessage}>
          {emptyMessage || t('inventory.noItems')}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          allItems={items}
          onClick={onItemClick ? () => onItemClick(item) : undefined}
        />
      ))}
    </div>
  );
};
