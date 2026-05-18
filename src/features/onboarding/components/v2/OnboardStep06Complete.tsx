import { useTranslation } from 'react-i18next';
import {
  Button,
  Caption,
  NumberDisplay,
  Title,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { HouseholdConfig, InventoryItem } from '@/shared/types';

interface OnboardStep06Props {
  household: HouseholdConfig;
  enabledCategories: Set<string>;
  onComplete: (household: HouseholdConfig, items: InventoryItem[]) => void;
}

export function OnboardStep06Complete({
  household,
  enabledCategories,
  onComplete,
}: Readonly<OnboardStep06Props>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
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
          <div>
            <Caption>{t(`v2.voice.readiness.${themeKey}`)}</Caption>
            <div style={{ marginTop: 8 }}>
              <NumberDisplay value="0" suffix="%" size={36} tone="crit" />
            </div>
          </div>
          <div>
            <Caption>
              {t(`v2.onboarding.step06.categoriesCaption.${themeKey}`)}
            </Caption>
            <div style={{ marginTop: 8 }}>
              <NumberDisplay
                value={enabledCategories.size}
                suffix="/10"
                size={36}
              />
            </div>
          </div>
          <div>
            <Caption>
              {t(`v2.onboarding.step06.daysCaption.${themeKey}`)}
            </Caption>
            <div style={{ marginTop: 8 }}>
              <NumberDisplay value={household.supplyDurationDays} size={36} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 32 }}>
          <Button variant="primary" onClick={() => onComplete(household, [])}>
            {t(`v2.onboarding.step06.openDashboard.${themeKey}`)}
          </Button>
        </div>
      </div>
    </div>
  );
}
