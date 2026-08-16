import { useTranslation } from 'react-i18next';

interface ItemNotFoundProps {
  onBack: () => void;
  /** Outer padding — desktop uses 32, mobile uses 24. */
  padding?: number;
}

/** Shared "Item not found" fallback used by both ItemDetail and
 *  MobileItemDetail when the requested itemId doesn't resolve. */
export function ItemNotFound({
  onBack,
  padding = 32,
}: Readonly<ItemNotFoundProps>) {
  const { t } = useTranslation();
  return (
    <div style={{ padding, color: 'var(--color-text-2)' }}>
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
