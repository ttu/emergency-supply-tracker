import { useTranslation } from 'react-i18next';
import {
  Button,
  Caption,
  Panel,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';

interface ItemOpsPanelProps {
  itemName: string;
  onAdjust: (delta: number) => void;
}

/** −1 / +1 / Consume quick-action grid. Writes via the parent's adjust callback. */
export function ItemOpsPanel({
  itemName,
  onAdjust,
}: Readonly<ItemOpsPanelProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  return (
    <Panel padding={20}>
      <Caption>{t(`v2.itemDetail.opsCaption.${themeKey}`)}</Caption>
      <div
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        <Button
          variant="secondary"
          onClick={() => onAdjust(-1)}
          ariaLabel={t('v2.itemDetail.opsDecreaseAria', { name: itemName })}
        >
          −1
        </Button>
        <Button
          variant="secondary"
          onClick={() => onAdjust(1)}
          ariaLabel={t('v2.itemDetail.opsIncreaseAria', { name: itemName })}
        >
          +1
        </Button>
        <div style={{ gridColumn: 'span 2' }}>
          <Button variant="secondary" full onClick={() => onAdjust(-1)}>
            {t(`v2.itemDetail.opsConsume.${themeKey}`)}
          </Button>
        </div>
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-text-3)',
          letterSpacing: '0.06em',
        }}
      >
        {t(`v2.itemDetail.opsHint.${themeKey}`)}
      </div>
    </Panel>
  );
}
