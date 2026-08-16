import { useTranslation } from 'react-i18next';
import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useSettings } from '@/features/settings';
import { SectionHeader, ToggleRow } from './SettingsRows';

export function AdvancedSection() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { settings, updateSettings } = useSettings();

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
          last
        />
      </Panel>
    </section>
  );
}
