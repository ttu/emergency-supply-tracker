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
import styles from './OnboardHousehold.module.css';

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
          <div className={styles.sidePanel}>
            <div className={styles.figureRow}>
              <NumberDisplay value={targets.water} size={48} />
              <span className={styles.figureLabel}>
                {t(`v2.onboarding.household.waterLabel.${themeKey}`, {
                  days: household.supplyDurationDays,
                })}
              </span>
            </div>
            <div className={styles.formula}>{waterFormula}</div>
          </div>
          <div className={`${styles.sidePanel} ${styles.sidePanelSpaced}`}>
            <div className={styles.figureRow}>
              <NumberDisplay
                value={targets.kcal.toLocaleString(i18n.language)}
                size={36}
              />
            </div>
            <div className={styles.formula}>
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
      <div className={styles.coverageBlock}>
        <Caption>
          {t(`v2.onboarding.household.coverageTarget.${themeKey}`)}
        </Caption>
        <div className={styles.dayOptions}>
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
                className={`${styles.dayButton} ${sel ? styles.dayButtonActive : ''}`}
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
  return (
    <div className={styles.stepperRow}>
      <div>
        <Caption>{label}</Caption>
        <div className={styles.stepperHint}>{hint}</div>
      </div>
      <div className={styles.stepperControls}>
        <button
          type="button"
          aria-label={t('v2.onboarding.stepperDecreaseAria', { label })}
          onClick={() => onChange(Math.max(min, value - 1))}
          // At the floor the button does nothing; saying so beats letting
          // someone press it and wonder why the count will not move.
          disabled={value <= min}
          className={styles.stepperButton}
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
          className={styles.stepperValue}
        >
          {String(value).padStart(2, '0')}
        </div>
        <button
          type="button"
          aria-label={t('v2.onboarding.stepperIncreaseAria', { label })}
          onClick={() => onChange(value + 1)}
          className={`${styles.stepperButton} ${styles.stepperButtonIncrement}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
