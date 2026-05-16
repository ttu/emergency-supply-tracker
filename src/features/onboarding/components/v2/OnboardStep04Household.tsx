import type { CSSProperties } from 'react';
import {
  Caption,
  NumberDisplay,
  Panel,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { HouseholdConfig } from '@/shared/types';
import { OnboardLayout } from './OnboardLayout';
import { computeOnboardingTargets } from './onboardingPresets';

interface OnboardStep04Props {
  household: HouseholdConfig;
  onHouseholdChange: (update: (h: HouseholdConfig) => HouseholdConfig) => void;
  onNext: () => void;
  onBack: () => void;
}

/** Step 4: Adults/Children/Pets steppers + Coverage target chips + live targets. */
export function OnboardStep04Household({
  household,
  onHouseholdChange,
  onNext,
  onBack,
}: OnboardStep04Props) {
  const { themeKey } = useDesignTheme();
  const targets = computeOnboardingTargets(household);

  return (
    <OnboardLayout
      step={4}
      title={themeKey === 'pantry' ? 'Details' : 'HOUSEHOLD · §4 PROFILE'}
      lead={{
        title:
          themeKey === 'pantry'
            ? 'Fine-tune your household.'
            : 'CONFIRM HOUSEHOLD PARAMETERS',
        sub:
          themeKey === 'pantry'
            ? 'These drive every recommendation. Adjust now or any time in settings.'
            : 'PARAMETERS DRIVE BASELINE QUANTITIES. EACH CHILD COUNTS AS 0.75 ADULT-EQUIVALENT.',
      }}
      back={onBack}
      onContinue={onNext}
      side={
        <div>
          <Caption>
            {themeKey === 'pantry' ? 'Calculated targets' : 'COMPUTED · LIVE'}
          </Caption>
          <div
            style={{
              marginTop: 16,
              padding: 20,
              background: 'var(--color-panel)',
              border: '1px solid var(--color-rule)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <NumberDisplay value={targets.water} size={48} />
              <span style={{ fontSize: 14, color: 'var(--color-text-2)' }}>
                {themeKey === 'pantry'
                  ? 'litres of water'
                  : `L WATER · ${household.supplyDurationDays}D`}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-3)',
                marginTop: 6,
              }}
            >
              = 3 L × {household.adults} ADULTS × {household.supplyDurationDays}{' '}
              DAYS
            </div>
          </div>
          <div
            style={{
              marginTop: 14,
              padding: 20,
              background: 'var(--color-panel)',
              border: '1px solid var(--color-rule)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <NumberDisplay value={targets.kcal.toLocaleString()} size={36} />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-3)',
                marginTop: 6,
              }}
            >
              {themeKey === 'pantry' ? 'Total kcal' : 'KCAL TOTAL'}
            </div>
          </div>
        </div>
      }
    >
      <Panel padding={0}>
        <OnboardStepperRow
          label={themeKey === 'pantry' ? 'Adults' : 'ADULTS'}
          hint={themeKey === 'pantry' ? 'Aged 14+' : 'AGE ≥ 14 · FULL RATIONS'}
          value={household.adults}
          onChange={(v) => onHouseholdChange((h) => ({ ...h, adults: v }))}
          min={1}
        />
        <OnboardStepperRow
          label={themeKey === 'pantry' ? 'Children' : 'CHILDREN'}
          hint={
            themeKey === 'pantry'
              ? 'Under 14, scaled to 75%'
              : 'AGE < 14 · 0.75× SCALE'
          }
          value={household.children}
          onChange={(v) => onHouseholdChange((h) => ({ ...h, children: v }))}
        />
        <OnboardStepperRow
          label={themeKey === 'pantry' ? 'Pets' : 'PETS'}
          hint={
            themeKey === 'pantry'
              ? 'Adds a pet category'
              : 'ENABLES §PET CATEGORY'
          }
          value={household.pets}
          onChange={(v) => onHouseholdChange((h) => ({ ...h, pets: v }))}
        />
      </Panel>
      <div style={{ marginTop: 14 }}>
        <Caption>
          {themeKey === 'pantry' ? 'Target days' : 'COVERAGE TARGET'}
        </Caption>
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          {[3, 7, 14, 30].map((n) => {
            const sel = household.supplyDurationDays === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() =>
                  onHouseholdChange((h) => ({ ...h, supplyDurationDays: n }))
                }
                style={{
                  padding: '8px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                  color: sel ? 'var(--color-accent)' : 'var(--color-text-2)',
                  background: 'transparent',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                }}
              >
                {n}D
              </button>
            );
          })}
        </div>
      </div>
    </OnboardLayout>
  );
}

interface StepperRowProps {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}

function OnboardStepperRow({
  label,
  hint,
  value,
  onChange,
  min = 0,
}: StepperRowProps) {
  const buttonStyle: CSSProperties = {
    width: 36,
    height: 36,
    border: '1px solid var(--color-rule)',
    background: 'transparent',
    color: 'var(--color-text)',
    fontSize: 18,
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
  };
  return (
    <div
      style={{
        padding: '18px 22px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: 16,
        borderBottom: '1px solid var(--color-rule-soft)',
      }}
    >
      <div>
        <Caption>{label}</Caption>
        <div
          style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 4 }}
        >
          {hint}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          style={buttonStyle}
        >
          −
        </button>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 28,
            fontWeight: 600,
            minWidth: 56,
            textAlign: 'center',
            color: 'var(--color-text)',
            fontFeatureSettings: '"tnum"',
          }}
        >
          {String(value).padStart(2, '0')}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          style={{
            ...buttonStyle,
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            border: 'none',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
