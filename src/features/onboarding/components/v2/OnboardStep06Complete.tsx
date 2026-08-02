import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Caption,
  NumberDisplay,
  Title,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useRecommendedItems } from '@/features/templates';
import { buildOnboardingItems } from './buildOnboardingItems';
import type { HouseholdConfig, InventoryItem } from '@/shared/types';

interface OnboardStep06Props {
  household: HouseholdConfig;
  enabledCategories: Set<string>;
  onComplete: (household: HouseholdConfig, items: InventoryItem[]) => void;
}

/** One captioned figure in the completion screen's summary grid. */
function SummaryStat({
  caption,
  children,
}: Readonly<{ caption: string; children: ReactNode }>) {
  return (
    <div>
      <Caption>{caption}</Caption>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

export function OnboardStep06Complete({
  household,
  enabledCategories,
  onComplete,
}: Readonly<OnboardStep06Props>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { recommendedItems } = useRecommendedItems();

  // Finish with the picked categories' recommended items already on the list,
  // the way v1's quick setup does — otherwise a new household lands on an
  // empty inventory with nothing to work from.
  const seedItems = () =>
    buildOnboardingItems(
      recommendedItems,
      household,
      enabledCategories,
      (key) => t(key.replace('products.', ''), { ns: 'products' }),
    );
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      <div style={{ maxWidth: 720, textAlign: 'left' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-accent)',
            letterSpacing: '0.12em',
          }}
        >
          ✓ {t(`v2.onboarding.step06.setupComplete.${themeKey}`)}
        </div>
        <Title size={56} style={{ marginTop: 18 }}>
          {t(`v2.onboarding.step06.title.${themeKey}`)}
        </Title>
        <div
          style={{
            marginTop: 18,
            fontSize: 16,
            color: 'var(--color-text-2)',
            lineHeight: 1.6,
          }}
        >
          {t(`v2.onboarding.step06.subtitle.${themeKey}`, {
            count: enabledCategories.size,
          })}
        </div>
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: 'var(--color-panel)',
            border: '1px solid var(--color-rule)',
            borderRadius: 'var(--radius-lg)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
        >
          <SummaryStat caption={t(`v2.voice.readiness.${themeKey}`)}>
            <NumberDisplay value="0" suffix="%" size={36} tone="crit" />
          </SummaryStat>
          <SummaryStat
            caption={t(`v2.onboarding.step06.categoriesCaption.${themeKey}`)}
          >
            <NumberDisplay
              value={enabledCategories.size}
              suffix="/10"
              size={36}
            />
          </SummaryStat>
          <SummaryStat
            caption={t(`v2.onboarding.step06.daysCaption.${themeKey}`)}
          >
            <NumberDisplay value={household.supplyDurationDays} size={36} />
          </SummaryStat>
        </div>
        <div style={{ marginTop: 32 }}>
          <Button
            variant="primary"
            onClick={() => onComplete(household, seedItems())}
          >
            {t(`v2.onboarding.step06.openDashboard.${themeKey}`)}
          </Button>
        </div>
      </div>
    </div>
  );
}
