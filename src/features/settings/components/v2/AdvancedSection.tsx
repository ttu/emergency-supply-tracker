import { useTranslation } from 'react-i18next';
import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useSettings } from '@/features/settings';
import { useDesignPrefs } from '@/features/settings/hooks/useDesignPref';
import { SectionHeader, ToggleRow } from './SettingsRows';

export function AdvancedSection() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { settings, updateSettings } = useSettings();
  const [designPrefs, setDesignPref] = useDesignPrefs();

  const adv = settings.advancedFeatures ?? {
    calorieTracking: false,
    powerManagement: false,
    waterTracking: false,
  };
  const setAdv = (k: keyof typeof adv) => (v: boolean) =>
    updateSettings({ advancedFeatures: { ...adv, [k]: v } });

  return (
    <section id="sec-advanced" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§5"
        title={t(`v2.settings.advanced.title.${themeKey}`)}
        sub={t(`v2.settings.advanced.sub.${themeKey}`)}
      />
      <Panel padding={0}>
        <ToggleRow
          label={t(`v2.settings.advanced.calorie.${themeKey}`)}
          hint={t(`v2.settings.advanced.calorieHint.${themeKey}`)}
          on={adv.calorieTracking}
          onChange={setAdv('calorieTracking')}
        />
        <ToggleRow
          label={t(`v2.settings.advanced.power.${themeKey}`)}
          hint={t(`v2.settings.advanced.powerHint.${themeKey}`)}
          on={adv.powerManagement}
          onChange={setAdv('powerManagement')}
        />
        <ToggleRow
          label={t(`v2.settings.advanced.water.${themeKey}`)}
          hint={t(`v2.settings.advanced.waterHint.${themeKey}`)}
          on={adv.waterTracking}
          onChange={setAdv('waterTracking')}
        />
        <ToggleRow
          label={t(`v2.settings.advanced.planView.${themeKey}`)}
          hint={t(`v2.settings.advanced.planViewHint.${themeKey}`)}
          on={designPrefs.planViewBeta}
          onChange={(v) => setDesignPref('planViewBeta', v)}
          last
        />
      </Panel>
    </section>
  );
}
