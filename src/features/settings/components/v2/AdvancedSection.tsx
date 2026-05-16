import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useSettings } from '@/features/settings';
import { useDesignPrefs } from '@/features/settings/hooks/useDesignPref';
import { SectionHeader, ToggleRow } from './SettingsRows';

/** §5 Advanced features: 5 capability toggles. */
export function AdvancedSection() {
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
        title={
          themeKey === 'pantry' ? 'Advanced features' : 'ADVANCED FEATURES'
        }
        sub={
          themeKey === 'pantry'
            ? 'Disabled by default — turn on what you need'
            : 'OPTIONAL CAPABILITIES · DISABLED BY DEFAULT'
        }
      />
      <Panel padding={0}>
        <ToggleRow
          label={
            themeKey === 'pantry' ? 'Calorie tracking' : 'CALORIE TRACKING'
          }
          hint={
            themeKey === 'pantry'
              ? 'Track total calories across food items.'
              : 'TOTAL KCAL ACROSS FOOD INVENTORY'
          }
          on={adv.calorieTracking}
          onChange={setAdv('calorieTracking')}
        />
        <ToggleRow
          label={
            themeKey === 'pantry' ? 'Power management' : 'POWER MANAGEMENT'
          }
          hint={
            themeKey === 'pantry'
              ? 'Estimate days of power from batteries and power banks.'
              : 'COMPUTE OFF-GRID RUNTIME'
          }
          on={adv.powerManagement}
          onChange={setAdv('powerManagement')}
        />
        <ToggleRow
          label={
            themeKey === 'pantry'
              ? 'Water tracking (advanced)'
              : 'WATER TRACKING · ADVANCED'
          }
          hint={
            themeKey === 'pantry'
              ? 'Separate tracking for drinking, cooking, and hygiene water.'
              : 'SPLIT INTO DRINK / COOK / HYGIENE BUCKETS'
          }
          on={adv.waterTracking}
          onChange={setAdv('waterTracking')}
        />
        <ToggleRow
          label={
            themeKey === 'pantry' ? 'Plan view (preview)' : 'PLAN VIEW · BETA'
          }
          hint={
            themeKey === 'pantry'
              ? 'Track high-level preparedness goals, not just items.'
              : 'OBJECTIVE-LEVEL TRACKING · v0.5'
          }
          on={designPrefs.planViewBeta}
          onChange={(v) => setDesignPref('planViewBeta', v)}
        />
        <ToggleRow
          label={
            themeKey === 'pantry'
              ? 'Multi-device sync (coming soon)'
              : 'MULTI-DEVICE SYNC · ROADMAP'
          }
          hint={
            themeKey === 'pantry'
              ? 'Share inventory across devices via encrypted backup.'
              : 'NOT YET AVAILABLE · E2E ENCRYPTED'
          }
          on={false}
          onChange={() => {
            /* roadmap — disabled */
          }}
          last
        />
      </Panel>
    </section>
  );
}
