import {
  Button,
  Caption,
  Title,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { categoryCode } from '@/shared/i18n/voice';

interface ItemDetailHeaderProps {
  isNew: boolean;
  itemName?: string;
  itemCategoryId?: string;
  categoryName?: string;
  onDelete?: () => void;
}

/** Caption + title + category line; right-aligned Delete for existing items. */
export function ItemDetailHeader({
  isNew,
  itemName,
  itemCategoryId,
  categoryName,
  onDelete,
}: ItemDetailHeaderProps) {
  const { themeKey, voice } = useDesignTheme();
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <div>
        <Caption>
          {isNew
            ? themeKey === 'pantry'
              ? 'New item'
              : 'NEW ITEM'
            : themeKey === 'pantry'
              ? 'Item details'
              : 'ITEM RECORD'}
        </Caption>
        <Title size={32} style={{ marginTop: 4 }}>
          {isNew
            ? themeKey === 'pantry'
              ? 'Add an item'
              : 'ADD ITEM'
            : itemName}
        </Title>
        {itemCategoryId && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-3)',
              marginTop: 6,
              letterSpacing: '0.06em',
            }}
          >
            {categoryCode(itemCategoryId)} · {categoryName ?? itemCategoryId}
          </div>
        )}
      </div>
      {!isNew && onDelete && (
        <Button variant="secondary" onClick={onDelete}>
          {voice.delete}
        </Button>
      )}
    </div>
  );
}
