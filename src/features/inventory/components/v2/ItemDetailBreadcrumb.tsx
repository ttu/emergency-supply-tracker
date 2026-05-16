import type { CSSProperties } from 'react';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { categoryCode } from '@/shared/i18n/voice';

interface ItemDetailBreadcrumbProps {
  itemId?: string;
  itemCategoryId?: string;
  defaultCategoryId?: string;
  onBack: () => void;
}

const breadcrumbStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.08em',
};

/** Inventory / CAT / id back link, also handles the "new" case. */
export function ItemDetailBreadcrumb({
  itemId,
  itemCategoryId,
  defaultCategoryId,
  onBack,
}: ItemDetailBreadcrumbProps) {
  const { themeKey, voice } = useDesignTheme();
  const cat = itemCategoryId ?? defaultCategoryId;
  const catLabel = cat
    ? categoryCode(cat)
    : themeKey === 'pantry'
      ? 'New'
      : 'NEW';
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          ...breadcrumbStyle,
          color: 'var(--color-text-2)',
        }}
      >
        ← {voice.inventory}
      </button>
      <span style={{ color: 'var(--color-text-3)' }}>/</span>
      <span style={{ ...breadcrumbStyle, color: 'var(--color-text-3)' }}>
        {catLabel}
      </span>
      {itemId && (
        <>
          <span style={{ color: 'var(--color-text-3)' }}>/</span>
          <span style={{ ...breadcrumbStyle, color: 'var(--color-text)' }}>
            {itemId.slice(0, 10)}
          </span>
        </>
      )}
    </div>
  );
}
