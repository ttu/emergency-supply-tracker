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

/** Step 6: provisioning-complete summary + Open dashboard CTA. */
export function OnboardStep06Complete({
  household,
  enabledCategories,
  onComplete,
}: OnboardStep06Props) {
  const { themeKey, voice } = useDesignTheme();
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
          ✓{' '}
          {themeKey === 'pantry'
            ? 'Setup complete · 5 / 5'
            : 'SETUP COMPLETE · 05 / 05'}
        </div>
        <Title size={56} style={{ marginTop: 18 }}>
          {themeKey === 'pantry' ? "You're set up." : 'PROVISIONING COMPLETE'}
        </Title>
        <div
          style={{
            marginTop: 18,
            fontSize: 16,
            color: 'var(--color-text-2)',
            lineHeight: 1.6,
          }}
        >
          {themeKey === 'pantry'
            ? "Your starting kit is ready. We'll keep an eye on expiry dates and remind you when something runs low — open the dashboard to see what's next."
            : `BASELINE PROVISIONED · ${enabledCategories.size} CATEGORIES ENABLED. EXPIRY MONITORING ACTIVE.`}
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
            <Caption>{voice.readiness}</Caption>
            <div style={{ marginTop: 8 }}>
              <NumberDisplay value="0" suffix="%" size={36} tone="crit" />
            </div>
          </div>
          <div>
            <Caption>
              {themeKey === 'pantry' ? 'Categories' : 'CATEGORIES'}
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
              {themeKey === 'pantry' ? 'Days target' : 'TARGET DAYS'}
            </Caption>
            <div style={{ marginTop: 8 }}>
              <NumberDisplay value={household.supplyDurationDays} size={36} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 32 }}>
          <Button variant="primary" onClick={() => onComplete(household, [])}>
            {themeKey === 'pantry' ? 'Open dashboard →' : 'OPEN OVERVIEW →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
