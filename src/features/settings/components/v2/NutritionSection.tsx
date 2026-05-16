import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useSettings } from '@/features/settings';
import { useDesignPrefs } from '@/features/settings/hooks/useDesignPref';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import { createPercentage } from '@/shared/types';
import {
  ReadField,
  SectionHeader,
  StepperRow,
  ToggleRow,
} from './SettingsRows';

/** §4 Nutrition: kcal/water/children steppers + expiry warn + hygiene toggle. */
export function NutritionSection() {
  const { themeKey } = useDesignTheme();
  const { settings, updateSettings } = useSettings();
  const [designPrefs, setDesignPref] = useDesignPrefs();

  const cal = settings.dailyCaloriesPerPerson ?? DAILY_CALORIES_PER_PERSON;
  const water = settings.dailyWaterPerPerson ?? DAILY_WATER_PER_PERSON;
  const childPct =
    settings.childrenRequirementPercentage ??
    CHILDREN_REQUIREMENT_MULTIPLIER * 100;

  return (
    <section id="sec-nutrition" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§4"
        title={
          themeKey === 'pantry'
            ? 'Nutrition & requirements'
            : 'NUTRITION & REQUIREMENTS'
        }
        sub={
          themeKey === 'pantry'
            ? 'Fine-tune per-person targets'
            : 'OVERRIDE DEFAULT PER-PERSON BASELINES'
        }
      />
      <Panel padding={0}>
        <StepperRow
          label={
            themeKey === 'pantry'
              ? 'Calories per person per day'
              : 'KCAL · PERSON · DAY'
          }
          hint={
            themeKey === 'pantry'
              ? `Default: ${DAILY_CALORIES_PER_PERSON}`
              : `DEFAULT ${DAILY_CALORIES_PER_PERSON} · 72TUNTIA.FI BASELINE`
          }
          value={cal}
          onChange={(v) =>
            updateSettings({ dailyCaloriesPerPerson: Math.max(0, v) })
          }
          step={50}
          min={0}
          max={10000}
          suffix="kcal"
        />
        <StepperRow
          label={
            themeKey === 'pantry'
              ? 'Water per person per day'
              : 'WATER · PERSON · DAY'
          }
          hint={
            themeKey === 'pantry'
              ? 'Drinking and cooking combined'
              : 'DRINKING + COOKING · L'
          }
          value={water}
          onChange={(v) =>
            updateSettings({ dailyWaterPerPerson: Math.max(0, v) })
          }
          step={0.5}
          decimals={1}
          min={0}
          max={20}
          suffix="L"
        />
        <StepperRow
          label={
            themeKey === 'pantry' ? 'Children scale' : 'CHILDREN MULTIPLIER'
          }
          hint={
            themeKey === 'pantry'
              ? 'Children typically need less — default 75%'
              : 'PERCENT OF ADULT BASELINE'
          }
          value={childPct}
          onChange={(v) =>
            updateSettings({
              childrenRequirementPercentage: createPercentage(
                Math.min(100, Math.max(0, v)),
              ),
            })
          }
          step={5}
          min={0}
          max={100}
          suffix="%"
        />
        <ReadField
          label={
            themeKey === 'pantry'
              ? 'Expiry warning window'
              : 'EXPIRY WARN WINDOW'
          }
          value="30 days"
          hint={themeKey === 'pantry' ? 'fixed' : 'WARN ≤ N DAYS BEFORE EXPIRY'}
        />
        <ToggleRow
          label={
            themeKey === 'pantry'
              ? 'Track hygiene water separately'
              : 'TRACK HYGIENE WATER SEPARATELY'
          }
          hint={
            themeKey === 'pantry'
              ? 'Add 3 L/person/day for hygiene'
              : 'ADDS 3 L/PERSON/DAY · ADV WATER MODE'
          }
          on={designPrefs.trackHygieneWaterSeparately}
          onChange={(v) => setDesignPref('trackHygieneWaterSeparately', v)}
          last
        />
      </Panel>
    </section>
  );
}
