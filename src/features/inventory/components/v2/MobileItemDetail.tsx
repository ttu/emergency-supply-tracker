import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Button,
  NumberDisplay,
  Panel,
  StatusDot,
  Title,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import { statusOf } from '@/shared/utils/designStatus';
import {
  useInventory,
  useLocationSuggestions,
  ItemForm,
} from '@/features/inventory';
import { NEW_ITEM_ID } from './ItemDetail';
import type { InventoryItem } from '@/shared/types';

interface MobileItemDetailProps {
  itemId: string;
  onBack: () => void;
  defaultCategoryId?: string;
}

function mobileDetailTitle(
  isNew: boolean,
  themeKey: string,
  itemName: string | undefined,
  t: TFunction,
): string | undefined {
  if (!isNew) return itemName;
  return t(`v2.itemDetail.titleNew.${themeKey}`);
}

export function MobileItemDetail({
  itemId,
  onBack,
  defaultCategoryId,
}: Readonly<MobileItemDetailProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { rows, categories } = useDesignData();
  const { items, addItem, updateItem, deleteItem } = useInventory();
  const locationSuggestions = useLocationSuggestions(items);
  const isNew = itemId === NEW_ITEM_ID;
  const row = isNew
    ? undefined
    : rows.find((r) => String(r.item.id) === itemId);

  if (!isNew && !row) {
    return (
      <div style={{ padding: 24, color: 'var(--color-text-2)' }}>
        {t('v2.itemDetail.notFound')}{' '}
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none',
            border: 0,
            color: 'var(--color-accent)',
            cursor: 'pointer',
          }}
        >
          {t('v2.itemDetail.backLink')}
        </button>
      </div>
    );
  }

  const item = row?.item;
  const status = item ? statusOf(item, row?.recommended ?? 0) : 'ok';
  const pct =
    item && row?.recommended
      ? Math.round((item.quantity / row.recommended) * 100)
      : 0;

  const handleSubmit = (
    update: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (isNew) {
      addItem(update);
    } else if (item) {
      updateItem(item.id, update);
    }
    onBack();
  };
  const handleDelete = () => {
    if (!item) return;
    if (!confirm(t(`v2.itemDetail.confirmDelete.${themeKey}`))) return;
    deleteItem(item.id);
    onBack();
  };

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-2)',
          letterSpacing: '0.08em',
          cursor: 'pointer',
          textAlign: 'left',
          padding: 0,
        }}
      >
        ← {t(`v2.voice.inventory.${themeKey}`)}
      </button>
      <div>
        <Title size={22}>
          {mobileDetailTitle(isNew, themeKey, item?.name, t)}
        </Title>
        {item && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-3)',
              marginTop: 4,
            }}
          >
            {String(item.id).slice(0, 12)} · {row?.categoryCode}
          </div>
        )}
      </div>

      {!isNew && item && (
        <Panel padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusDot status={status} size={10} />
            <NumberDisplay value={pct} suffix="%" size={32} tone={status} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-2)',
                marginLeft: 'auto',
              }}
            >
              {item.quantity}/{row?.recommended || '—'} {item.unit}
            </span>
          </div>
        </Panel>
      )}

      <Panel padding={0}>
        <div className="design-v2-embed" style={{ padding: 14 }}>
          <ItemForm
            item={item}
            categories={categories}
            defaultCategoryId={defaultCategoryId}
            locationSuggestions={locationSuggestions}
            onSubmit={handleSubmit}
            onCancel={onBack}
          />
        </div>
      </Panel>

      {!isNew && (
        <Button variant="ghost" full onClick={handleDelete}>
          {t(`v2.voice.delete.${themeKey}`)}
        </Button>
      )}
    </div>
  );
}
