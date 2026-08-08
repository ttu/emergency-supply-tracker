import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Button,
  Caption,
  NumberDisplay,
  Panel,
} from '@/shared/components/design-v2/primitives';
import type { HouseholdPreset } from '@/features/household/presets';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { useHousehold } from '@/features/household';
import { useInventory } from '@/features/inventory';
import { useSettings } from '@/features/settings';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import type { HouseholdConfig } from '@/shared/types';
import {
  PanelHeader,
  SectionHeader,
  StepperRow,
  ToggleRow,
} from './SettingsRows';

interface HouseholdLabels {
  adults: string;
  adultsHint: string;
  children: string;
  childrenHint: string;
  pets: string;
  petsHint: string;
  days: string;
  daysHint: string;
  freezer: string;
  freezerHint: string;
}

interface ComputedFigureProps {
  marginTop: number;
  value: string | number;
  size: number;
  unitSize: number;
  unit: string;
  formula: string;
}

/** A derived target: the figure, its unit, and the arithmetic behind it. */
function ComputedFigure({
  marginTop,
  value,
  size,
  unitSize,
  unit,
  formula,
}: Readonly<ComputedFigureProps>) {
  return (
    <div style={{ marginTop }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <NumberDisplay value={value} size={size} />
        <span style={{ fontSize: unitSize, color: 'var(--color-text-2)' }}>
          {unit}
        </span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-text-3)',
          marginTop: 4,
        }}
      >
        {formula}
      </div>
    </div>
  );
}

/** Item count, split off below a rule from the calculated targets above. */
function ItemsTracked({
  caption,
  value,
}: Readonly<{ caption: string; value: number }>) {
  return (
    <div
      style={{
        marginTop: 18,
        paddingTop: 16,
        borderTop: '1px solid var(--color-rule-soft)',
      }}
    >
      <Caption>{caption}</Caption>
      <div
        style={{
          marginTop: 6,
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
        }}
      >
        <NumberDisplay value={value} size={28} />
      </div>
    </div>
  );
}

function householdLabels(themeKey: string, t: TFunction): HouseholdLabels {
  return {
    adults: t(`v2.settings.household.adults.${themeKey}`),
    adultsHint: t(`v2.settings.household.adultsHint.${themeKey}`),
    children: t(`v2.settings.household.children.${themeKey}`),
    childrenHint: t(`v2.settings.household.childrenHint.${themeKey}`),
    pets: t(`v2.settings.household.pets.${themeKey}`),
    petsHint: t(`v2.settings.household.petsHint.${themeKey}`),
    days: t(`v2.settings.household.days.${themeKey}`),
    daysHint: t(`v2.settings.household.daysHint.${themeKey}`),
    freezer: t(`v2.settings.household.freezer.${themeKey}`),
    freezerHint: t(`v2.settings.household.freezerHint.${themeKey}`),
  };
}

export function HouseholdSection() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const isMobile = useIsMobile();
  const { household, updateHousehold, setPreset } = useHousehold();
  const { items } = useInventory();
  const { settings } = useSettings();

  const cal = settings.dailyCaloriesPerPerson ?? DAILY_CALORIES_PER_PERSON;
  const water = settings.dailyWaterPerPerson ?? DAILY_WATER_PER_PERSON;
  const childPct =
    settings.childrenRequirementPercentage ??
    CHILDREN_REQUIREMENT_MULTIPLIER * 100;

  const setNum = (k: keyof HouseholdConfig) => (v: number) =>
    updateHousehold({ [k]: Math.max(0, v) });
  const L = householdLabels(themeKey, t);

  const waterForLabel = t(`v2.settings.household.waterFor.${themeKey}`, {
    days: household.supplyDurationDays,
  });
  const totalFoodLabel = t(`v2.settings.household.totalFood.${themeKey}`, {
    days: household.supplyDurationDays,
  });

  const computed = useMemo(() => {
    const ppl = household.adults + household.children * (childPct / 100);
    const days = household.supplyDurationDays;
    return {
      // Children count at their own multiplier, so the figure is per
      // "person-equivalent" rather than per head. The formula below has to
      // quote the same number or it contradicts the value it explains.
      people: Number.isInteger(ppl) ? String(ppl) : ppl.toFixed(1),
      water: Math.ceil(water * ppl * days),
      kcal: Math.ceil(cal * ppl * days),
      itemCount: items.length,
    };
  }, [household, childPct, water, cal, items.length]);

  return (
    <section id="sec-household" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§2"
        title={t(`v2.settings.household.title.${themeKey}`)}
      />
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        {(['single', 'couple', 'family'] as HouseholdPreset[]).map((preset) => (
          <Button
            key={preset}
            variant="secondary"
            onClick={() => setPreset(preset)}
          >
            {t(`v2.onboarding.preset.presetNames.${preset}.${themeKey}`)}
          </Button>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr',
          gap: 14,
        }}
      >
        <Panel padding={0}>
          <PanelHeader>
            {t(`v2.settings.household.profileHeader.${themeKey}`)}
          </PanelHeader>
          <StepperRow
            label={L.adults}
            hint={L.adultsHint}
            value={household.adults}
            onChange={setNum('adults')}
            min={1}
          />
          <StepperRow
            label={L.children}
            hint={L.childrenHint}
            value={household.children}
            onChange={setNum('children')}
          />
          <StepperRow
            label={L.pets}
            hint={L.petsHint}
            value={household.pets}
            onChange={setNum('pets')}
          />
          <StepperRow
            label={L.days}
            hint={L.daysHint}
            value={household.supplyDurationDays}
            onChange={setNum('supplyDurationDays')}
            suffix="d"
            min={1}
            max={365}
          />
          <ToggleRow
            label={L.freezer}
            hint={L.freezerHint}
            on={!!household.useFreezer}
            onChange={(v) => updateHousehold({ useFreezer: v })}
            last
          />
        </Panel>
        <Panel padding={20}>
          <Caption>{t(`v2.settings.household.calculated.${themeKey}`)}</Caption>
          <ComputedFigure
            marginTop={14}
            value={computed.water}
            size={40}
            unitSize={13}
            unit={`L · ${waterForLabel}`}
            formula={t('v2.settings.household.waterFormula', {
              water,
              people: computed.people,
              days: household.supplyDurationDays,
            })}
          />
          <ComputedFigure
            marginTop={18}
            value={computed.kcal.toLocaleString()}
            size={28}
            unitSize={12}
            unit={`kcal · ${totalFoodLabel}`}
            formula={t('v2.settings.household.foodFormula', {
              calories: cal,
              people: computed.people,
              days: household.supplyDurationDays,
            })}
          />
          <ItemsTracked
            caption={t(`v2.settings.household.itemsTracked.${themeKey}`)}
            value={computed.itemCount}
          />
        </Panel>
      </div>
    </section>
  );
}
