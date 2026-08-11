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
      <div style={{ marginTop: 8 }}>{children}</div>
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
    <div
      className="v2-viewport-height"
      style={{
        width: '100%',
        // Its own scroll container, for the same reason OnboardLayout is one:
        // the v2 themes lock the document.
        overflowY: 'auto',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 6vw, 60px)',
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
          ✓ {t(`v2.onboarding.complete.setupComplete.${themeKey}`)}
        </div>
        <Title size={56} style={{ marginTop: 18 }}>
          {t(`v2.onboarding.complete.title.${themeKey}`)}
        </Title>
        <div
          style={{
            marginTop: 18,
            fontSize: 16,
            color: 'var(--color-text-2)',
            lineHeight: 1.6,
          }}
        >
          {t(`v2.onboarding.complete.subtitle.${themeKey}`, {
            count: items.length,
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
        <div style={{ marginTop: 32 }}>
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
