import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Caption,
  NumberDisplay,
  Title,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { HouseholdConfig, InventoryItem } from '@/shared/types';
import styles from './OnboardComplete.module.css';

interface OnboardCompleteProps {
  household: HouseholdConfig;
  /** What quick setup produced — already built, not rebuilt here. */
  items: InventoryItem[];
  onComplete: (household: HouseholdConfig, items: InventoryItem[]) => void;
}

function readinessTone(readiness: number): 'crit' | 'warn' | 'ok' {
  if (readiness === 0) return 'crit';
  if (readiness === 100) return 'ok';
  return 'warn';
}

/** One captioned figure in the completion screen's summary grid. */
function SummaryStat({
  caption,
  children,
}: Readonly<{ caption: string; children: ReactNode }>) {
  return (
    <div>
      <Caption>{caption}</Caption>
      <div className={styles.statValue}>{children}</div>
    </div>
  );
}

export function OnboardComplete({
  household,
  items,
  onComplete,
}: Readonly<OnboardCompleteProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();

  const stocked = items.filter((i) => i.quantity > 0).length;
  const readiness = items.length
    ? Math.round((stocked / items.length) * 100)
    : 0;

  return (
    <div className={`v2-viewport-height ${styles.viewport}`}>
      <div className={styles.content}>
        <div className={styles.completeLabel}>
          ✓ {t(`v2.onboarding.complete.setupComplete.${themeKey}`)}
        </div>
        <Title size={56} style={{ marginTop: 18 }}>
          {t(`v2.onboarding.complete.title.${themeKey}`)}
        </Title>
        <div className={styles.subtitle}>
          {t(`v2.onboarding.complete.subtitle.${themeKey}`, {
            count: items.length,
          })}
        </div>
        <div className={styles.summaryGrid}>
          <SummaryStat caption={t(`v2.voice.readiness.${themeKey}`)}>
            <NumberDisplay
              value={readiness}
              suffix="%"
              size={36}
              tone={readinessTone(readiness)}
            />
          </SummaryStat>
          <SummaryStat
            caption={t(`v2.onboarding.complete.itemsCaption.${themeKey}`)}
          >
            <NumberDisplay value={items.length} size={36} />
          </SummaryStat>
          <SummaryStat
            caption={t(`v2.onboarding.complete.daysCaption.${themeKey}`)}
          >
            <NumberDisplay value={household.supplyDurationDays} size={36} />
          </SummaryStat>
        </div>
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={() => onComplete(household, items)}
          >
            {t(`v2.onboarding.complete.openDashboard.${themeKey}`)}
          </Button>
        </div>
      </div>
    </div>
  );
}
