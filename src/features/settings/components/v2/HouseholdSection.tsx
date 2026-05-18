import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
  const L = householdLabels(themeKey, t);

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
        title={t(`v2.settings.household.title.${themeKey}`)}
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
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <NumberDisplay value={computed.water} size={40} />
              <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
                L ·{' '}
                {t(`v2.settings.household.waterFor.${themeKey}`, {
                  days: household.supplyDurationDays,
                })}
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
                {t(`v2.settings.household.totalFood.${themeKey}`, {
                  days: household.supplyDurationDays,
                })}
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
              {t(`v2.settings.household.itemsTracked.${themeKey}`)}
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
