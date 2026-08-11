import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Caption,
  NumberDisplay,
  Panel,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { HouseholdConfig } from '@/shared/types';
import { OnboardLayout } from './OnboardLayout';
import {
  computeOnboardingTargets,
  ONBOARDING_CHILD_WEIGHT,
  ONBOARDING_WATER_LITERS_PER_ADULT_PER_DAY,
} from './onboardingPresets';

interface OnboardHouseholdProps {
  household: HouseholdConfig;
  onHouseholdChange: (update: (h: HouseholdConfig) => HouseholdConfig) => void;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardHousehold({
  household,
  onHouseholdChange,
  onNext,
  onBack,
}: Readonly<OnboardHouseholdProps>) {
  const { t, i18n } = useTranslation();
  const { themeKey } = useDesignTheme();
  const targets = computeOnboardingTargets(household);

  const waterFormula =
    household.children > 0
      ? t(`v2.onboarding.household.waterFormulaWithChildren.${themeKey}`, {
          waterPerPerson: ONBOARDING_WATER_LITERS_PER_ADULT_PER_DAY,
          adults: household.adults,
          adultsLabel: t(`v2.onboarding.labelAdults.${themeKey}`),
          children: household.children,
          childrenLabel: t(`v2.onboarding.labelChildren.${themeKey}`),
          childWeight: ONBOARDING_CHILD_WEIGHT,
          days: household.supplyDurationDays,
          daysLabel: t(`v2.onboarding.labelDays.${themeKey}`),
        })
      : t(`v2.onboarding.household.waterFormula.${themeKey}`, {
          waterPerPerson: ONBOARDING_WATER_LITERS_PER_ADULT_PER_DAY,
          adults: household.adults,
          adultsLabel: t(`v2.onboarding.labelAdults.${themeKey}`),
          days: household.supplyDurationDays,
          daysLabel: t(`v2.onboarding.labelDays.${themeKey}`),
        });

  return (
    <OnboardLayout
      step={4}
      title={t(`v2.voice.onbHousehold.${themeKey}`)}
      lead={{
        title: t(`v2.onboarding.household.leadTitle.${themeKey}`),
        sub: t(`v2.onboarding.household.leadSub.${themeKey}`),
      }}
      back={onBack}
      onContinue={onNext}
      side={
        <div>
          <Caption>
            {t(`v2.onboarding.household.computedCaption.${themeKey}`)}
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
                {t(`v2.onboarding.household.waterLabel.${themeKey}`, {
                  days: household.supplyDurationDays,
                })}
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
              {waterFormula}
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
              <NumberDisplay
                value={targets.kcal.toLocaleString(i18n.language)}
                size={36}
              />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-3)',
                marginTop: 6,
              }}
            >
              {t(`v2.onboarding.household.kcalTotal.${themeKey}`)}
            </div>
          </div>
        </div>
      }
    >
      <Panel padding={0}>
        <OnboardStepperRow
          label={t(`v2.onboarding.labelAdults.${themeKey}`)}
          hint={t(`v2.onboarding.household.adultsHint.${themeKey}`)}
          value={household.adults}
          onChange={(v) => onHouseholdChange((h) => ({ ...h, adults: v }))}
          min={1}
          t={t}
        />
        <OnboardStepperRow
          label={t(`v2.onboarding.labelChildren.${themeKey}`)}
          hint={t(`v2.onboarding.household.childrenHint.${themeKey}`)}
          value={household.children}
          onChange={(v) => onHouseholdChange((h) => ({ ...h, children: v }))}
          t={t}
        />
        <OnboardStepperRow
          label={t(`v2.onboarding.labelPets.${themeKey}`)}
          hint={t(`v2.onboarding.household.petsHint.${themeKey}`)}
          value={household.pets}
          onChange={(v) => onHouseholdChange((h) => ({ ...h, pets: v }))}
          t={t}
        />
      </Panel>
      <div style={{ marginTop: 14 }}>
        <Caption>
          {t(`v2.onboarding.household.coverageTarget.${themeKey}`)}
        </Caption>
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          {[3, 7, 14, 30].map((n) => {
            const sel = household.supplyDurationDays === n;
            return (
              <button
                key={n}
                type="button"
                // Colour alone carries the choice otherwise, which neither a
                // screen reader nor a colour-blind reader can pick up.
                aria-pressed={sel}
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
                {t(`v2.onboarding.household.dayOption.${themeKey}`, {
                  count: n,
                })}
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
  t: TFunction;
}

function OnboardStepperRow({
  label,
  hint,
  value,
  onChange,
  min = 0,
  t,
}: Readonly<StepperRowProps>) {
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
          aria-label={t('v2.onboarding.stepperDecreaseAria', { label })}
          onClick={() => onChange(Math.max(min, value - 1))}
          // At the floor the button does nothing; saying so beats letting
          // someone press it and wonder why the count will not move.
          disabled={value <= min}
          style={{ ...buttonStyle, opacity: value <= min ? 0.4 : 1 }}
        >
          −
        </button>
        {/* The count is the control's value, not decoration beside two
            buttons: as a plain number it is unreachable and unannounced.
            Spinbutton semantics give it the value, the floor and the arrow
            keys that assistive tech expects of a stepper. */}
        <div // NOSONAR S6819 - composite value+arrow-key stepper, see comment above
          role="spinbutton"
          tabIndex={0}
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={min}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              onChange(value + 1);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              onChange(Math.max(min, value - 1));
            }
          }}
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
          aria-label={t('v2.onboarding.stepperIncreaseAria', { label })}
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
