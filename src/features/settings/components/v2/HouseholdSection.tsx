import { useMemo } from 'react';
import {
  Caption,
  NumberDisplay,
  Panel,
} from '@/shared/components/design-v2/primitives';
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

function householdLabels(themeKey: string): HouseholdLabels {
  if (themeKey === 'pantry') {
    return {
      adults: 'Adults',
      adultsHint: 'Aged 14 and over',
      children: 'Children',
      childrenHint: 'Under 14 — scaled to 75%',
      pets: 'Pets',
      petsHint: 'Enables the pets category',
      days: 'Target days of supply',
      daysHint: 'How many days you want to be self-sufficient',
      freezer: 'Use freezer',
      freezerHint: 'Adds frozen-food recommendations',
    };
  }
  return {
    adults: 'ADULTS',
    adultsHint: 'AGE ≥ 14 · 1.0× SCALE',
    children: 'CHILDREN',
    childrenHint: 'AGE < 14 · 0.75× SCALE',
    pets: 'PETS',
    petsHint: 'ENABLES §PET CATEGORY',
    days: 'COVERAGE TARGET',
    daysHint: 'DAYS · SELF-SUFFICIENCY TARGET',
    freezer: 'USE FREEZER',
    freezerHint: 'INCLUDES FROZEN ITEMS IN BASELINE',
  };
}

/** §2 Household: profile steppers + freezer toggle + computed/live side panel. */
export function HouseholdSection() {
  const { themeKey } = useDesignTheme();
  const isMobile = useIsMobile();
  const { household, updateHousehold } = useHousehold();
  const { items } = useInventory();
  const { settings } = useSettings();

  const cal = settings.dailyCaloriesPerPerson ?? DAILY_CALORIES_PER_PERSON;
  const water = settings.dailyWaterPerPerson ?? DAILY_WATER_PER_PERSON;
  const childPct =
    settings.childrenRequirementPercentage ??
    CHILDREN_REQUIREMENT_MULTIPLIER * 100;

  const setNum = (k: keyof HouseholdConfig) => (v: number) =>
    updateHousehold({ [k]: Math.max(0, v) });
  const L = householdLabels(themeKey);

  const computed = useMemo(() => {
    const ppl = household.adults + household.children * (childPct / 100);
    const days = household.supplyDurationDays;
    return {
      water: Math.ceil(water * ppl * days),
      kcal: Math.ceil(cal * ppl * days),
      itemCount: items.length,
    };
  }, [household, childPct, water, cal, items.length]);

  return (
    <section id="sec-household" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§2"
        title={themeKey === 'pantry' ? 'Household' : 'HOUSEHOLD'}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr',
          gap: 14,
        }}
      >
        <Panel padding={0}>
          <PanelHeader>
            {themeKey === 'pantry' ? 'Profile' : 'PROFILE · §2.1'}
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
          <Caption>
            {themeKey === 'pantry' ? 'Calculated' : 'COMPUTED · LIVE'}
          </Caption>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <NumberDisplay value={computed.water} size={40} />
              <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
                L ·{' '}
                {themeKey === 'pantry'
                  ? `water for ${household.supplyDurationDays}d`
                  : `WATER · ${household.supplyDurationDays}D`}
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
              = {water} L × {household.adults} ADULTS ×{' '}
              {household.supplyDurationDays} D
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <NumberDisplay value={computed.kcal.toLocaleString()} size={28} />
              <span style={{ fontSize: 12, color: 'var(--color-text-2)' }}>
                kcal ·{' '}
                {themeKey === 'pantry'
                  ? `total food`
                  : `TOTAL · ${household.supplyDurationDays}D`}
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
              = {cal} × {household.adults} × {household.supplyDurationDays} D
            </div>
          </div>
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: '1px solid var(--color-rule-soft)',
            }}
          >
            <Caption>
              {themeKey === 'pantry' ? 'Items tracked' : 'INVENTORY ITEMS'}
            </Caption>
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
              }}
            >
              <NumberDisplay value={computed.itemCount} size={28} />
            </div>
          </div>
        </Panel>
      </div>
    </section>
  );
}
