import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

function headerCaption(isNew: boolean, themeKey: string, t: TFunction): string {
  return isNew
    ? t(`v2.itemDetail.captionNew.${themeKey}`)
    : t(`v2.itemDetail.captionExisting.${themeKey}`);
}

function headerTitle(
  isNew: boolean,
  themeKey: string,
  itemName: string | undefined,
  t: TFunction,
): string | undefined {
  if (!isNew) return itemName;
  return t(`v2.itemDetail.titleNew.${themeKey}`);
}

export function ItemDetailHeader({
  isNew,
  itemName,
  itemCategoryId,
  categoryName,
  onDelete,
}: Readonly<ItemDetailHeaderProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <div>
        <Caption>{headerCaption(isNew, themeKey, t)}</Caption>
        <Title size={32} style={{ marginTop: 4 }}>
          {headerTitle(isNew, themeKey, itemName, t)}
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
          {t(`v2.voice.delete.${themeKey}`)}
        </Button>
      )}
    </div>
  );
}
