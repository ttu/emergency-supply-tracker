import { useTranslation } from 'react-i18next';
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

export function NutritionSection() {
  const { t } = useTranslation();
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
        title={t(`v2.settings.nutrition.title.${themeKey}`)}
        sub={t(`v2.settings.nutrition.sub.${themeKey}`)}
      />
      <Panel padding={0}>
        <StepperRow
          label={t(`v2.settings.nutrition.calories.${themeKey}`)}
          hint={t(`v2.settings.nutrition.caloriesHint.${themeKey}`, {
            default: DAILY_CALORIES_PER_PERSON,
          })}
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
          label={t(`v2.settings.nutrition.water.${themeKey}`)}
          hint={t(`v2.settings.nutrition.waterHint.${themeKey}`)}
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
          label={t(`v2.settings.nutrition.children.${themeKey}`)}
          hint={t(`v2.settings.nutrition.childrenHint.${themeKey}`)}
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
          label={t(`v2.settings.nutrition.expiryWindow.${themeKey}`)}
          value="30 days"
          hint={t(`v2.settings.nutrition.expiryWindowHint.${themeKey}`)}
        />
        <ToggleRow
          label={t(`v2.settings.nutrition.hygiene.${themeKey}`)}
          hint={t(`v2.settings.nutrition.hygieneHint.${themeKey}`)}
          on={designPrefs.trackHygieneWaterSeparately}
          onChange={(v) => setDesignPref('trackHygieneWaterSeparately', v)}
          last
        />
      </Panel>
    </section>
  );
}
