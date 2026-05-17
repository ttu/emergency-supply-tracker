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
function headerCaption(isNew: boolean, themeKey: string): string {
  if (isNew) return themeKey === 'pantry' ? 'New item' : 'NEW ITEM';
  return themeKey === 'pantry' ? 'Item details' : 'ITEM RECORD';
}

function headerTitle(
  isNew: boolean,
  themeKey: string,
  itemName: string | undefined,
): string | undefined {
  if (!isNew) return itemName;
  return themeKey === 'pantry' ? 'Add an item' : 'ADD ITEM';
}

export function ItemDetailHeader({
  isNew,
  itemName,
  itemCategoryId,
  categoryName,
  onDelete,
}: Readonly<ItemDetailHeaderProps>) {
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
        <Caption>{headerCaption(isNew, themeKey)}</Caption>
        <Title size={32} style={{ marginTop: 4 }}>
          {headerTitle(isNew, themeKey, itemName)}
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
